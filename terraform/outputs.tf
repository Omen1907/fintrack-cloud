output "backend_url" {
  description = "Backend Container App URL"
  value       = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
}

output "frontend_url" {
  description = "Frontend Container App URL"
  value       = "https://${azurerm_container_app.frontend.ingress[0].fqdn}"
}

output "acr_login_server" {
  description = "Container Registry login server"
  value       = azurerm_container_registry.acr.login_server
}
