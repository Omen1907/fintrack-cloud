variable "resource_group_name" {
  description = "Name of the Azure resource group"
  type        = string
  default     = "fintrack-rg-tf"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "uksouth"
}

variable "postgres_admin_user" {
  description = "PostgreSQL admin username"
  type        = string
  default     = "postgresadmin"
}

variable "postgres_admin_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for the backend"
  type        = string
  sensitive   = true
}

variable "acr_name" {
  description = "Azure Container Registry name"
  type        = string
  default     = "fintrackregistrytf"
}
