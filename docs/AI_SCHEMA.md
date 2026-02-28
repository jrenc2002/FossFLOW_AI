# FossFLOW AI Diagram Generation Schema

## Overview

FossFLOW AI allows you to generate architecture diagrams by describing your system in natural language. The AI generates a JSON schema that is automatically converted into a visual isometric architecture diagram.

## JSON Schema Format

The AI generates (or you can manually write) a JSON object with the following structure:

```json
{
  "title": "My System Architecture",
  "description": "Optional description of the architecture",
  "nodes": [
    {
      "id": "unique-node-id",
      "name": "Display Name",
      "description": "Optional description",
      "icon": "icon_type",
      "position": { "x": 200, "y": 200 }
    }
  ],
  "connectors": [
    {
      "id": "unique-connector-id",
      "from": "source-node-id",
      "to": "target-node-id",
      "label": "Connection Label",
      "color": "blue",
      "style": "solid"
    }
  ],
  "groups": [
    {
      "id": "group-id",
      "label": "Group Name",
      "color": "blue",
      "from": { "x": 100, "y": 100 },
      "to": { "x": 500, "y": 400 }
    }
  ]
}
```

## Field Reference

### Root Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Title of the architecture diagram |
| `description` | string | ❌ | Description of the architecture |
| `nodes` | array | ✅ | List of nodes (services, components) |
| `connectors` | array | ✅ | List of connections between nodes |
| `groups` | array | ❌ | Optional grouping rectangles |

### Node Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier (kebab-case, e.g., `api-gateway`) |
| `name` | string | ✅ | Display name shown on the diagram |
| `description` | string | ❌ | Description shown on hover/click |
| `icon` | string | ✅ | Icon type (see Available Icons below) |
| `position` | object | ❌ | `{ x: number, y: number }` - Grid position. Auto-layout if omitted |

### Connector Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier |
| `from` | string | ✅ | Source node ID |
| `to` | string | ✅ | Target node ID |
| `label` | string | ❌ | Label displayed on the connection line |
| `color` | string | ❌ | Color: `blue`, `green`, `red`, `orange`, `purple`, `black`, `gray` |
| `style` | string | ❌ | Line style: `solid` (default), `dotted`, `dashed` |

### Group Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier |
| `label` | string | ❌ | Display label for the group |
| `color` | string | ❌ | Color reference |
| `from` | object | ✅ | `{ x, y }` - Top-left corner |
| `to` | object | ✅ | `{ x, y }` - Bottom-right corner |

## Available Icons

| Icon ID | Name | Best Used For |
|---------|------|---------------|
| `person` | Person | End users, actors |
| `web_app` | Web Application | Web apps, websites, frontends |
| `api` | API | API endpoints, REST services |
| `load_balancer` | Load Balancer | Traffic distribution, L4/L7 balancers |
| `microservice` | Microservice | Backend services, workers |
| `redis` | Redis/Cache | Caching, session stores, Redis |
| `authentication` | Authentication | Auth services, OAuth, SSO |
| `shield` | Security | Firewalls, WAF, security services |
| `gateway` | Gateway | API gateways, network gateways |
| `bank` | Bank/Finance | Payment, banking, financial services |
| `database` | Database | Databases, data warehouses |
| `notification` | Notification | Email, SMS, push notifications |
| `monitoring` | Monitoring | Monitoring, alerting, APM |
| `cdn` | CDN | Content delivery, edge caching |
| `mobile` | Mobile App | Mobile applications |
| `backup` | Backup | Backup, disaster recovery |
| `analytics` | Analytics | BI, analytics, reporting |
| `queue` | Message Queue | Kafka, RabbitMQ, SQS |
| `logs` | Logs | Logging, audit trails, ELK |
| `office` | Office | Organizations, teams |
| `user` | User | User accounts, profiles |
| `block` | Block | Generic components |
| `function-module` | Function | Serverless, Lambda, functions |
| `plane` | Transport | Network transport, connectivity |
| `paymentcard` | Payment Card | Payment processing, billing |

## Layout Guidelines

- **Position range**: x: 50-950, y: 50-500
- **Minimum spacing**: ~150 units between nodes
- **Flow direction**: Left-to-right (users → frontend → backend → data)
- **Vertical grouping**: Related services at similar y positions

## Example: E-Commerce Platform

```json
{
  "title": "E-Commerce Microservices Architecture",
  "description": "Scalable e-commerce platform with microservices",
  "nodes": [
    { "id": "customer", "name": "Customer", "icon": "person", "position": { "x": 100, "y": 200 } },
    { "id": "web-app", "name": "Web Store", "icon": "web_app", "position": { "x": 250, "y": 200 } },
    { "id": "api-gw", "name": "API Gateway", "icon": "gateway", "position": { "x": 400, "y": 200 } },
    { "id": "auth", "name": "Auth Service", "icon": "authentication", "position": { "x": 400, "y": 350 } },
    { "id": "catalog", "name": "Product Catalog", "icon": "microservice", "position": { "x": 550, "y": 150 } },
    { "id": "cart", "name": "Shopping Cart", "icon": "redis", "position": { "x": 550, "y": 250 } },
    { "id": "payment", "name": "Payment Service", "icon": "bank", "position": { "x": 550, "y": 350 } },
    { "id": "orders", "name": "Order Service", "icon": "microservice", "position": { "x": 700, "y": 200 } },
    { "id": "db", "name": "PostgreSQL", "icon": "database", "position": { "x": 700, "y": 350 } },
    { "id": "notify", "name": "Notifications", "icon": "notification", "position": { "x": 850, "y": 200 } }
  ],
  "connectors": [
    { "id": "c1", "from": "customer", "to": "web-app", "label": "Browse & Buy", "color": "blue" },
    { "id": "c2", "from": "web-app", "to": "api-gw", "label": "API Calls", "color": "green" },
    { "id": "c3", "from": "api-gw", "to": "auth", "label": "Authenticate", "color": "purple" },
    { "id": "c4", "from": "api-gw", "to": "catalog", "label": "Products", "color": "green" },
    { "id": "c5", "from": "api-gw", "to": "cart", "label": "Cart Ops", "color": "orange" },
    { "id": "c6", "from": "api-gw", "to": "payment", "label": "Pay", "color": "green" },
    { "id": "c7", "from": "payment", "to": "orders", "label": "Create Order", "color": "green" },
    { "id": "c8", "from": "orders", "to": "db", "label": "Store", "color": "blue" },
    { "id": "c9", "from": "orders", "to": "notify", "label": "Confirm", "color": "purple" }
  ]
}
```

## Using the AI Feature

1. Click the **🤖 AI Generate** button in the toolbar
2. **Generate Tab**: Describe your architecture in natural language, then click "Generate"
3. **JSON Tab**: Paste or edit the JSON schema directly
4. **Settings Tab**: Configure your AI provider (OpenAI, DeepSeek, Ollama, or custom)

### Supported AI Providers

| Provider | Endpoint | Notes |
|----------|----------|-------|
| **OpenAI** | `https://api.openai.com/v1/chat/completions` | Recommended: GPT-4o |
| **DeepSeek** | `https://api.deepseek.com/v1/chat/completions` | Cost-effective alternative |
| **Ollama** | `http://localhost:11434/v1/chat/completions` | Free, local, no API key needed |
| **Custom** | Any OpenAI-compatible endpoint | For self-hosted or other providers |

### Tips for Better Results

- Be specific about services and their roles
- Mention the technologies you want to use
- Describe the data flow between services
- Specify which connections are synchronous vs asynchronous
- Mention security, monitoring, and logging requirements
