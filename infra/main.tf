terraform {
  required_version = ">= 1.5"

  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "0.18.0"
    }
    render = {
      source  = "render-oss/render"
      version = "1.9.1"
    }
  }
}

provider "neon" {}   # lee NEON_API_KEY
provider "render" {} # lee RENDER_API_KEY y RENDER_OWNER_ID

# --- El proyecto de Neon de PREPROD: no existe hasta que esto se aplica ---

resource "neon_project" "preprod" {
  name   = "ingsoft3-tp01-preprod"
  org_id = "org-red-haze-75125588"

  # Sin esto el primer apply falla: el provider pide 86400s (1 dia) de
  # historial por default, y el plan gratuito solo admite 21600 (6 horas).
  history_retention_seconds = 21600
}

resource "neon_role" "preprod" {
  project_id = neon_project.preprod.id
  branch_id  = neon_project.preprod.default_branch_id
  name       = "app_preprod_owner"
}

resource "neon_database" "preprod" {
  project_id = neon_project.preprod.id
  branch_id  = neon_project.preprod.default_branch_id
  name       = "app_preprod"
  owner_name = neon_role.preprod.name
}

# --- Los 2 servicios de Render de PREPROD: corren la imagen del TP7 ---

resource "render_web_service" "api" {
  name   = "ingsoft3-tp01-api-preprod"
  plan   = "free"
  region = var.region

  runtime_source = {
    image = {
      image_url = var.image_repo_api
      tag       = var.image_tag
    }
  }

  env_vars = {
    DB_HOST     = { value = neon_project.preprod.database_host }
    DB_PORT     = { value = "5432" }
    DB_NAME     = { value = neon_database.preprod.name }
    DB_USER     = { value = neon_role.preprod.name }
    DB_PASSWORD = { value = neon_role.preprod.password }
    DB_SSL      = { value = "true" }
    PORT        = { value = "8080" }
  }
}

resource "render_web_service" "front" {
  name   = "ingsoft3-tp01-front-preprod"
  plan   = "free"
  region = var.region

  runtime_source = {
    image = {
      image_url = var.image_repo_front
      tag       = var.image_tag
    }
  }

  env_vars = {
    BACKEND_URL    = { value = render_web_service.api.url } # se deriva, no se copia
    NGINX_RESOLVER = { value = "8.8.8.8" }                  # el nombre que usa frontend/templates/default.conf.template
  }
}
