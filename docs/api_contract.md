# IoT ShieldAI — REST API Contract

Base URL: `http://localhost:8000`

Interactive OpenAPI Documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

---

## 1. System Endpoints

### `GET /health`
- **Summary**: Health check and service metadata.
- **Request**: None.
- **Responses**:
  - `200 OK`:
    ```json
    {
      "status": "ok",
      "service": "iot-shieldai-api",
      "version": "0.1.0",
      "environment": "development",
      "timestamp": "2026-10-31T17:00:00.000000Z"
    }
    ```

---

## 2. Firmware Pipeline Endpoints

### `POST /api/upload`
- **Summary**: Upload one or more firmware source files (`.c`, `.cpp`, `.h`, `.hpp`).
- **Content-Type**: `multipart/form-data`
- **Form Parameters**:
  - `files`: File[] (Required, maximum 10 MB per file)
  - `project_name`: string (Optional)
- **Responses**:
  - `200 OK`:
    ```json
    {
      "upload_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "file_count": 1,
      "files": [
        {
          "filename": "sensor_driver.c",
          "size_bytes": 1024,
          "saved_path": "uploads/3fa85f64-5717-4562-b3fc-2c963f66afa6/sensor_driver.c"
        }
      ]
    }
    ```
  - `400 Bad Request`: Disallowed extension or empty file upload.

---

### `POST /api/analyze`
- **Summary**: Run Module 1 detection and static analysis on uploaded files.
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "upload_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
  ```
- **Responses**:
  - `200 OK` (`VulnerabilityList`):
    ```json
    {
      "total": 1,
      "vulnerabilities": [
        {
          "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
          "file_path": "sensor_driver.c",
          "line_start": 29,
          "line_end": 29,
          "cwe_id": "CWE-121",
          "vuln_type": "Stack Buffer Overflow",
          "severity": "Critical",
          "description": "strcpy() copies user input into 32-byte stack buffer without bounds checking.",
          "root_cause": "unbounded strcpy into fixed stack buffer",
          "code_snippet": "strcpy(device_name, input);"
        }
      ]
    }
    ```

---

### `POST /api/repair`
- **Summary**: Run Module 2 repair (template or LLM fallback) for a specific vulnerability.
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "upload_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vulnerability_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "force_strategy": null
  }
  ```
- **Responses**:
  - `200 OK` (`Patch`):
    ```json
    {
      "id": "8d0f1189-9836-42ee-a12c-124fc8b90ff8",
      "vulnerability_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "strategy": "template",
      "original_code": "strcpy(device_name, input);",
      "patched_code": "strncpy(device_name, input, sizeof(device_name) - 1);\ndevice_name[sizeof(device_name) - 1] = '\\0';",
      "diff": "--- original\n+++ patched\n@@ -29,1 +29,2 @@\n-strcpy(device_name, input);\n+strncpy(device_name, input, sizeof(device_name) - 1);\n+device_name[sizeof(device_name) - 1] = '\\0';",
      "explanation": "Replaced unbounded strcpy() with strncpy() and ensured null termination.",
      "attempt_number": 1
    }
    ```

---

### `POST /api/verify`
- **Summary**: Run Module 3 verification inside the Docker sandbox for a generated patch.
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "patch_id": "8d0f1189-9836-42ee-a12c-124fc8b90ff8"
  }
  ```
- **Responses**:
  - `200 OK` (`VerificationResult`):
    ```json
    {
      "patch_id": "8d0f1189-9836-42ee-a12c-124fc8b90ff8",
      "compiles": true,
      "sanitizer_passed": true,
      "no_cheating_passed": true,
      "errors": [],
      "overall_status": "passed"
    }
    ```

---

### `GET /api/report/{report_id}`
- **Summary**: Retrieve completed pipeline results, metrics, and explanations by ID.
- **Request**: Path parameter `report_id` (UUID).
- **Responses**:
  - `200 OK` (`PipelineResult`):
    ```json
    {
      "id": "c56a4180-65aa-42ec-a945-5fd21dec0538",
      "created_at": "2026-10-31T17:00:00Z",
      "file_path": "sensor_driver.c",
      "vulnerabilities": [...],
      "patches": [...],
      "verification_results": [...],
      "metrics": {
        "binary_size_before_bytes": 24576,
        "binary_size_after_bytes": 24608,
        "binary_size_delta_bytes": 32,
        "estimated_stack_delta_bytes": -4,
        "cyclomatic_complexity_delta": 0.0
      },
      "explanation": "Applied bounds-checked string copy to prevent stack buffer overflow.",
      "total_vulnerabilities": 1,
      "total_patches_applied": 1
    }
    ```
  - `404 Not Found`: Report ID does not exist.
