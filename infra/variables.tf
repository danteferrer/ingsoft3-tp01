variable "image_repo_api" {
  default = "ghcr.io/danteferrer/ingsoft3-tp01-backend" # sin la etiqueta
}

variable "image_repo_front" {
  default = "ghcr.io/danteferrer/ingsoft3-tp01-frontend" # sin la etiqueta
}

variable "image_tag" {
  default = "sha-d700b516a5fd51b4a550ee7687c455ecdb8c3437" # un merge real del TP7
}

variable "region" {
  default = "virginia" # frankfurt | ohio | oregon | singapore | virginia -- misma region que QA/PROD
}
