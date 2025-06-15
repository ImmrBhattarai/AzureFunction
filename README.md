# Barcode Validator

Azure project utilizing Service Bus Queue and Azure Function (in C#) using Visual Studio

## Overview

This project implements a complete solution for generating and validating barcodes, leveraging Microsoft Azure Functions, Azure Service Bus Queues, and a modern JavaScript frontend. The backend is built with C# and the frontend uses HTML, CSS, and JavaScript.

The main components are:

- Barcode Generation (Azure Function)
- Barcode Validation (Azure Function)
- Service Bus message integration
- User-friendly frontend for barcode generation and validation

## Architecture

### Code
```
[User Frontend]
      |
      v
[Azure Function: Barcode Generator] --(Sends generated barcode to Service Bus Queue)-->
      |
      v
[Azure Function: Barcode Validator]
```

  - Barcode Generator Function: Receives value and due date, generates a barcode, encodes it as a PNG (base64), and sends the result to a Service Bus queue.
  - Service Bus Queue: Acts as a message broker between generator and validator components.
  - Barcode Validator Function: Receives a barcode, validates its structure and expiration date, and returns a validation result.
  - Frontend: Interacts with both functions via HTTP APIs, allowing users to generate and validate barcodes.

### Features

  - Generate a barcode by specifying value and due date
  - Encodes the generated barcode as a PNG image (base64)
  - Sends barcode data as a message to an Azure Service Bus queue
  - Validate barcodes for correct structure and expiration date
  - Modern frontend for easy interaction (generate, validate, copy barcode)
  - Logging and error handling throughout the application

## Azure Functions

### 1. Barcode Generator (FnBillGenerator/Function1.cs)

- Trigger: HTTP POST /api/barcode-generate
- Input: JSON with value and dueDate (YYYY-MM-DD)
- Process:  
  - Validates input fields
  - Constructs a 44-character barcode: bankCode + dateStr + valueStr
  - Encodes barcode as PNG using Code128 standard
  - Sends barcode data to Azure Service Bus Queue (generator-bill)
- Output: JSON with barcode, original value, due date, and image (base64)

**Example request:**

JSON
```
{
  "value": "100.50",
  "dueDate": "2025-07-01"
}
```

**Example response:**

JSON
```
{
  "barcode": "0082025070180000500...0000",
  "originalValue": 100.5,
  "dueDate": "2025-07-01T00:00:00",
  "imageBase64": "<PNG data>"
}
```

### 2. Barcode Validator (billvalidator/Function1.cs)

- Trigger: HTTP POST /api/barcode-validate
- Input: JSON with barcode
- Process:
  - Checks if barcode is present and 44 characters long
  - Extracts expiration date (positions 3-10 in barcode)
  - Validates date format and expiration
- Output: JSON with validation status and message

**Example request:**

JSON
```
{
  "barcode": "0082025070180000500...0000"
}
```

**Example response:**

JSON
```
{
  "valid": true,
  "message": "Valid ticket",
  "expiration": "01-07-2025"
}
```

## Azure Service Bus Integration

- The Barcode Generator Function sends generated barcode data to a Service Bus Queue (generator-bill).
- This enables decoupled processing and can be used for downstream tasks (e.g., auditing, notification).

## Frontend

- Located in the frontend/ directory.
- Features:
  - Generate barcodes with value and due date input
  - Display barcode (PNG image and text)
  - Validate existing barcodes
  - Copy barcode to clipboard
  - Responsive and user-friendly design
- Interacts with backend functions via fetch API calls.

## How to Run
### Prerequisites

- Visual Studio 2022 or later
- Azure Functions Core Tools
- Azure Service Bus (connection string required in environment variables)
- Node.js (for frontend development, optional)

#### Backend Setup

- Clone the repo.
- Set the ServiceBusConnectionString environment variable for both Functions.
- Run both Azure Functions projects:
  - FnBillGenerator (barcode generation)
  - billvalidator (barcode validation)

### Frontend Setup

- Open frontend/index.html in your browser.
- Make sure the API URLs in frontend/script.js match your local/remote Azure Functions endpoints.

### Environment Variables

- ServiceBusConnectionString: Azure Service Bus connection string (required for Barcode Generator).

### API Endpoints

|        Endpoint       |     Method     |           Description          |
|:----------------------|:--------------:|-------------------------------:|
| /api/barcode-generate |    POST        | Generates a new barcode        |
| /api/barcode-validate |    POST        | Validates a barcode            |

### Technologies Used
- Backend: C#, Azure Functions, Azure Service Bus, Application Insights
- Frontend: HTML, CSS, JavaScript (ES6+)
- Barcode Encoding: BarcodeStandard, SkiaSharp
