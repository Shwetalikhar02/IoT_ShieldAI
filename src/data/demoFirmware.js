/**
 * demoFirmware.js — Pre-loaded firmware dataset
 * 
 * Provides canonical C firmware samples matching CVE and CWE benchmarks:
 * 1. stack_overflow (CWE-121): unbounded strcpy into fixed stack buffer
 * 2. null_ptr_deref (CWE-476): malloc return value unchecked under OOM
 * 3. format_string (CWE-134): user input directly passed to printf
 * 4. use_after_free (CWE-416): heap pointer reused after free() without nullification
 * 5. integer_overflow (CWE-190): uint16_t multiplication wrap before malloc
 */

export const DEMO_SAMPLES = [
  {
    id: 'stack_overflow',
    label: 'Stack Buffer Overflow',
    cwe_id: 'CWE-121',
    vuln_type: 'Stack Buffer Overflow',
    severity: 'Critical',
    icon: '💥',
    filename: 'stack_overflow.c',
    description: 'strcpy() copies user-supplied input into a fixed-size 32-byte stack buffer without bounds checking, enabling stack corruption and arbitrary execution.',
    root_cause: 'unbounded strcpy into 32-byte stack buffer device_name without length validation',
    line: 29,
    benign_arg: 'IoTDevice-001',
    exploit_arg: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    asan_trigger: 'stack-buffer-overflow',
    fix_strategy: 'template',
    fix_description: 'Replace strcpy with strncpy bounded by sizeof(device_name)-1 and add explicit null termination',
    code: `/*
 * CWE-121: Stack Buffer Overflow
 * ================================
 * File: stack_overflow.c
 *
 * Vulnerability:
 *   strcpy() copies user-supplied input into a fixed-size 32-byte stack
 *   buffer without any bounds check.  If the input exceeds 31 bytes, it
 *   will corrupt adjacent stack memory.
 */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* Simulates a firmware function that reads a device name from user/network input */
void process_device_name(const char *input) {
    char device_name[32];  /* Fixed-size buffer — no room for >31 chars + NUL */

    /* VULNERABLE: no bounds check */
    strcpy(device_name, input);

    printf("[device] Name set to: %s\\n", device_name);
}

int main(int argc, char *argv[]) {
    const char *input = (argc > 1) ? argv[1] : "IoTDevice-001";
    printf("[main] Processing device name: %s\\n", input);
    process_device_name(input);
    printf("[main] Done.\\n");
    return 0;
}`
  },
  {
    id: 'null_ptr_deref',
    label: 'NULL Pointer Dereference',
    cwe_id: 'CWE-476',
    vuln_type: 'NULL Pointer Dereference',
    severity: 'High',
    icon: '🔴',
    filename: 'null_ptr_deref.c',
    description: 'malloc() return value not verified before dereferencing; triggers immediate crash under memory pressure.',
    root_cause: 'Unchecked return value from malloc() before writing sensor packet data',
    line: 20,
    benign_arg: 'valid_sensor_payload',
    exploit_arg: 'oom_simulation_packet',
    asan_trigger: 'SEGV on unknown address 0x000000000000',
    fix_strategy: 'template',
    fix_description: 'Added NULL pointer verification after dynamic allocation of reading to prevent dereference under OOM.',
    code: `/*
 * CWE-476: NULL Pointer Dereference
 * ===================================
 * File: null_ptr_deref.c
 *
 * Vulnerability:
 *   malloc() can return NULL if the system is out of memory.
 *   The code does not check the return value before dereferencing.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define SENSOR_DATA_SIZE 128

typedef struct {
    float temperature;
    float humidity;
    char  location[32];
} SensorReading;

/* Simulates reading a sensor packet from a network buffer */
SensorReading *parse_sensor_packet(const unsigned char *raw, size_t len) {
    if (len < sizeof(SensorReading)) {
        return NULL;
    }

    /* VULNERABLE: return value of malloc() is not checked */
    SensorReading *reading = (SensorReading *)malloc(sizeof(SensorReading));

    /* Dereferencing without NULL check */
    memcpy(reading, raw, sizeof(SensorReading));

    return reading;
}

int main(void) {
    unsigned char raw[sizeof(SensorReading)];
    memset(raw, 0, sizeof(raw));

    SensorReading *r = parse_sensor_packet(raw, sizeof(raw));
    if (r) {
        printf("[sensor] temp=%.2f hum=%.2f loc=%s\\n",
               r->temperature, r->humidity, r->location);
        free(r);
    } else {
        printf("[sensor] Failed to parse packet.\\n");
    }
    return 0;
}`
  },
  {
    id: 'format_string',
    label: 'Uncontrolled Format String',
    cwe_id: 'CWE-134',
    vuln_type: 'Uncontrolled Format String',
    severity: 'High',
    icon: '⚠️',
    filename: 'format_string.c',
    description: 'User-controlled buffer passed as first argument to printf(); enables reading stack memory or arbitrary write via %n.',
    root_cause: 'Direct printf() invocation on user-supplied log buffer without explicit "%s" specifier',
    line: 22,
    benign_arg: 'Sensor event received',
    exploit_arg: '%x %x %x %x %s %n',
    asan_trigger: 'format-security-leak',
    fix_strategy: 'template',
    fix_description: 'Supplied static format specifier "%s" to printf() to prevent arbitrary memory disclosure.',
    code: `/*
 * CWE-134: Uncontrolled Format String
 * =====================================
 * File: format_string.c
 *
 * Vulnerability:
 *   log_buf (containing user-controlled MQTT or CoAP payload) is passed
 *   directly as the format string argument to printf().
 */
#include <stdio.h>
#include <string.h>

#define LOG_BUFFER_SIZE 256

/* Simulates logging a received MQTT topic or CoAP payload */
void log_event(const char *event_data) {
    char log_buf[LOG_BUFFER_SIZE];
    snprintf(log_buf, sizeof(log_buf), "[LOG] ");
    strncat(log_buf, event_data, sizeof(log_buf) - strlen(log_buf) - 1);

    /* VULNERABLE: log_buf (which contains user data) is the format string */
    printf(log_buf);
    printf("\\n");
}

int main(int argc, char *argv[]) {
    const char *payload = (argc > 1) ? argv[1] : "Sensor event received";
    printf("[main] Logging event payload...\\n");
    log_event(payload);
    printf("[main] Done.\\n");
    return 0;
}`
  },
  {
    id: 'use_after_free',
    label: 'Use After Free',
    cwe_id: 'CWE-416',
    vuln_type: 'Use After Free',
    severity: 'Critical',
    icon: '☠️',
    filename: 'use_after_free.c',
    description: 'Heap memory is freed upon network disconnect, but packet pointer remains stale and is subsequently accessed.',
    root_cause: 'Dangling pointer pkt dereferenced after free() without nullification',
    line: 28,
    benign_arg: 'keepalive',
    exploit_arg: 'reallocate_spray_payload',
    asan_trigger: 'heap-use-after-free',
    fix_strategy: 'template',
    fix_description: 'Nullified pointer immediately upon freeing to eliminate dangling pointer references.',
    code: `/*
 * CWE-416: Use After Free
 * ========================
 * File: use_after_free.c
 *
 * Vulnerability:
 *   A heap-allocated packet buffer is freed after processing, but a stale
 *   pointer to the same memory is subsequently dereferenced.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    unsigned int  seq_number;
    unsigned char payload[64];
    size_t        payload_len;
} Packet;

/* Simulates processing a received network packet */
void process_packet(Packet *pkt) {
    printf("[net] Processing packet #%u (len=%zu)\\n",
           pkt->seq_number, pkt->payload_len);
}

/* Simulates a "free on disconnect" event handler */
void on_disconnect(Packet *pkt) {
    free(pkt);
    printf("[net] Packet buffer freed after disconnect.\\n");
}

int main(void) {
    Packet *pkt = (Packet *)malloc(sizeof(Packet));
    if (!pkt) {
        fprintf(stderr, "[main] malloc failed\\n");
        return 1;
    }
    pkt->seq_number  = 42;
    pkt->payload_len = 5;
    memcpy(pkt->payload, "hello", 5);

    process_packet(pkt);

    /* Simulate disconnect freeing the packet */
    on_disconnect(pkt);

    /* VULNERABLE: pkt is now freed but still dereferenced below */
    printf("[main] Seq after free: %u\\n", pkt->seq_number);
    return 0;
}`
  },
  {
    id: 'integer_overflow',
    label: 'Integer Overflow in Buffer Size',
    cwe_id: 'CWE-190',
    vuln_type: 'Integer Overflow',
    severity: 'High',
    icon: '🔢',
    filename: 'integer_overflow.c',
    description: '16-bit record count multiplied by element size overflows, resulting in an undersized malloc() allocation and subsequent heap overflow.',
    root_cause: 'Arithmetic multiplication wraps around before malloc() allocation',
    line: 18,
    benign_arg: '10',
    exploit_arg: '32768',
    asan_trigger: 'signed integer overflow / heap-buffer-overflow',
    fix_strategy: 'template',
    fix_description: 'Inserted integer multiplication overflow check before memory allocation.',
    code: `/*
 * CWE-190: Integer Overflow in Buffer Size Calculation
 * =====================================================
 * File: integer_overflow.c
 *
 * Vulnerability:
 *   A 16-bit (uint16_t) count value supplied from a network packet header
 *   is multiplied by a fixed record size before being passed to malloc().
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

#define RECORD_SIZE 8   /* bytes per record in the IoT telemetry frame */

/* Simulates receiving a telemetry batch from an IoT device over MQTT */
int process_telemetry_batch(uint16_t record_count, const unsigned char *data, size_t data_len) {
    /* VULNERABLE: multiplication may overflow before reaching malloc() */
    size_t buf_size = record_count * RECORD_SIZE;
    if (buf_size == 0) {
        fprintf(stderr, "[telemetry] Invalid batch size (0 bytes requested).\\n");
        return -1;
    }

    unsigned char *buf = (unsigned char *)malloc(buf_size);
    if (!buf) {
        fprintf(stderr, "[telemetry] malloc failed.\\n");
        return -1;
    }

    /* Copies data_len bytes into a potentially undersized buffer */
    size_t copy_len = (data_len < buf_size) ? data_len : buf_size;
    memcpy(buf, data, copy_len);

    printf("[telemetry] Processed %u records (%zu bytes).\\n", record_count, copy_len);
    free(buf);
    return 0;
}

int main(int argc, char *argv[]) {
    uint16_t count = (argc > 1) ? (uint16_t)atoi(argv[1]) : 10;
    size_t real_data_size = (size_t)count * RECORD_SIZE;
    unsigned char *fake_data = (unsigned char *)malloc(real_data_size ? real_data_size : 1);
    if (!fake_data) { return 1; }
    memset(fake_data, 0xAB, real_data_size);

    printf("[main] Sending batch: count=%u\\n", count);
    process_telemetry_batch(count, fake_data, real_data_size);
    free(fake_data);
    return 0;
}`
  }
]
