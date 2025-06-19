# Barcode Validator

Barcode Validator as a project is a development of a service responsible for checking and authenticating bank slips, with the aim of guaranteeing the validity of the information. It is an Azure project utilizing Service Bus Queue and Azure Function (in C#) using Visual Studio.
![2025_06_19_20_07_37](https://github.com/user-attachments/assets/cb87c723-ff84-4835-b4ca-35f008a3f678)


## Overview

This project implements a complete solution for generating and validating barcodes, leveraging Microsoft Azure Functions, Azure Service Bus Queues, and a modern JavaScript frontend. The backend is built with C# and the frontend uses HTML, CSS, and JavaScript.
![2025_06_19_20_06_59](https://github.com/user-attachments/assets/2ed7c60d-e2a9-4866-972b-3904a4c48641)


The main components are:

- Barcode Generation (Azure Function)
  ![2025_06_19_20_04_21](https://github.com/user-attachments/assets/b1716cd6-ea2b-4105-93d1-7f26450ec5d2)

- Barcode Validation (Azure Function)
  ![2025_06_19_20_04_53](https://github.com/user-attachments/assets/f9c44740-2021-419a-9e76-179617eb9dc6)

- Service Bus message integration
  ![2025_06_19_20_27_49](https://github.com/user-attachments/assets/cc1f2de9-9b44-4b3d-82f9-f124828ae41c)

- User friendly frontend for barcode generation and validation
  ![2025_06_19_20_07_37](https://github.com/user-attachments/assets/55ba6c3d-679f-4213-9360-150c65e46747)

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
![2025_06_19_20_03_39](https://github.com/user-attachments/assets/afabd08c-9a1d-4d30-ad3f-a1b03148fa39)
![2025_06_19_20_07_53](https://github.com/user-attachments/assets/e0193623-f1b7-4913-860f-ed1c710e9859)
![2025_06_19_20_09_07](https://github.com/user-attachments/assets/698e7e09-07cc-44a7-8660-c66913fb358f)
![2025_06_19_20_09_35](https://github.com/user-attachments/assets/b1351fe8-bf54-42c3-ae6b-7fb3468d3d9f)

### Features

  - Generate a barcode by specifying value and due date
  - Encodes the generated barcode as a PNG image (base64)
  - Sends barcode data as a message to an Azure Service Bus queue
  - Validate barcodes for correct structure and expiration date
  - Modern frontend for easy interaction (generate, validate, copy barcode)
  - Logging and error handling throughout the application

## Azure Functions
![2025_06_19_20_10_22](https://github.com/user-attachments/assets/3e60a0de-0fb5-406d-a08b-b9bf5d1c9db1)
![2025_06_19_20_10_46](https://github.com/user-attachments/assets/cc630c47-8959-49e0-a9e9-a2075fe73801)
![2025_06_19_20_11_13](https://github.com/user-attachments/assets/29b56945-7aba-48b0-b08d-27e9bae606de)
![2025_06_19_20_11_38](https://github.com/user-attachments/assets/670f592c-81ae-4d5d-8dd7-4f02d0a3fb83)

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
![image](https://github.com/user-attachments/assets/a115efb1-b414-4311-aa1e-3a72f6bd3058)


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

![2025_06_19_20_26_46](https://github.com/user-attachments/assets/2ef8c411-808e-49e7-b8b0-72573c703553)
![2025_06_19_20_27_31](https://github.com/user-attachments/assets/74bf029b-b03d-4aa7-9127-79cf424b84a9)
![2025_06_19_20_27_11](https://github.com/user-attachments/assets/7eb665d8-efa1-47d0-b35d-81d24f5160e1)
![2025_06_19_20_27_49](https://github.com/user-attachments/assets/5da58f02-1811-40f1-8292-1f1b683771a4)
![2025_06_19_20_28_33](https://github.com/user-attachments/assets/b236d5f7-cbfc-4d1c-aabc-206ebe8816cd)


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
