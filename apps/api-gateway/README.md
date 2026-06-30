# API Gateway

Public entry point for external traffic.

## Endpoints

| Method | Path | Forwards To |
|--------|------|-------------|
| POST | `/cart` | demand-service |
| POST | `/order` | inventory-service |
| POST | `/rating` | inventory-intelligence-service |

Validates requests and forwards them to the appropriate service.
