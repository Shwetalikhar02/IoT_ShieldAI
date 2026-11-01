/**
 * firmwareSamples.js — Embedded IoT Firmware Vulnerability Samples
 * 
 * Includes the 5 canonical demo firmware samples, extended Juliet/CVE test cases,
 * and deliberate cheating patch samples for verification testing.
 */

export const FIRMWARE_SAMPLES = [
  {
    id: 'stack_overflow',
    name: 'stack_overflow.c',
    category: 'demo',
    cwe_id: 'CWE-121',
    vuln_type: 'Stack Buffer Overflow',
    severity: 'Critical',
    line: 29,
    description: 'strcpy() copies user-supplied input into a fixed-size 32-byte stack buffer without bounds checking, enabling stack corruption and arbitrary execution.',
    root_cause: 'Unbounded strcpy() into 32-byte stack buffer device_name without length validation',
    benign_arg: 'IoTDevice-001',
    exploit_arg: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    asan_trigger: 'AddressSanitizer: stack-buffer-overflow on address 0x7ffd582b13e0',
    strategy: 'template',
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
}`,
    patched_code: `/*
 * CWE-121: Stack Buffer Overflow (REPAIRED)
 * ================================
 * File: stack_overflow.c
 */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* Simulates a firmware function that reads a device name from user/network input */
void process_device_name(const char *input) {
    char device_name[32];  /* Fixed-size buffer — no room for >31 chars + NUL */

    /* SECURED: bounded copy with explicit NUL terminator */
    strncpy(device_name, input, sizeof(device_name) - 1);
    device_name[sizeof(device_name) - 1] = '\\0';

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
    name: 'null_ptr_deref.c',
    category: 'demo',
    cwe_id: 'CWE-476',
    vuln_type: 'NULL Pointer Dereference',
    severity: 'High',
    line: 22,
    description: 'malloc() return value not verified before dereferencing; triggers immediate crash under memory pressure.',
    root_cause: 'Unchecked return value from malloc() before writing sensor packet data',
    benign_arg: 'valid_sensor_payload',
    exploit_arg: 'oom_simulation_packet',
    asan_trigger: 'AddressSanitizer: SEGV on unknown address 0x000000000000',
    strategy: 'template',
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
}`,
    patched_code: `/*
 * CWE-476: NULL Pointer Dereference (REPAIRED)
 * ===================================
 * File: null_ptr_deref.c
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

    SensorReading *reading = (SensorReading *)malloc(sizeof(SensorReading));
    if (reading == NULL) {
        fprintf(stderr, "[sensor] Memory allocation failed\\n");
        return NULL;
    }

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
    name: 'format_string.c',
    category: 'demo',
    cwe_id: 'CWE-134',
    vuln_type: 'Uncontrolled Format String',
    severity: 'High',
    line: 23,
    description: 'User-controlled buffer passed as first argument to printf(); enables reading stack memory or arbitrary write via %n.',
    root_cause: 'Direct printf() invocation on user-supplied log buffer without explicit "%s" specifier',
    benign_arg: 'Sensor event received',
    exploit_arg: '%x %x %x %x %s %n',
    asan_trigger: 'AddressSanitizer: format-security leak detected',
    strategy: 'template',
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
}`,
    patched_code: `/*
 * CWE-134: Uncontrolled Format String (REPAIRED)
 * =====================================
 * File: format_string.c
 */
#include <stdio.h>
#include <string.h>

#define LOG_BUFFER_SIZE 256

/* Simulates logging a received MQTT topic or CoAP payload */
void log_event(const char *event_data) {
    char log_buf[LOG_BUFFER_SIZE];
    snprintf(log_buf, sizeof(log_buf), "[LOG] ");
    strncat(log_buf, event_data, sizeof(log_buf) - strlen(log_buf) - 1);

    /* SECURED: static format string prevents format injection */
    printf("%s", log_buf);
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
    name: 'use_after_free.c',
    category: 'demo',
    cwe_id: 'CWE-416',
    vuln_type: 'Use After Free',
    severity: 'Critical',
    line: 38,
    description: 'Heap memory is freed upon network disconnect, but packet pointer remains stale and is subsequently accessed.',
    root_cause: 'Dangling pointer pkt dereferenced after free() without nullification',
    benign_arg: 'keepalive',
    exploit_arg: 'reallocate_spray_payload',
    asan_trigger: 'AddressSanitizer: heap-use-after-free on address 0x603000000040',
    strategy: 'template',
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
void on_disconnect(Packet **pkt) {
    if (pkt && *pkt) {
        free(*pkt);
        *pkt = NULL;
    }
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
    free(pkt);
    /* VULNERABLE: pkt is now freed but still dereferenced below */
    printf("[main] Seq after free: %u\\n", pkt->seq_number);
    return 0;
}`,
    patched_code: `/*
 * CWE-416: Use After Free (REPAIRED)
 * ========================
 * File: use_after_free.c
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    unsigned int  seq_number;
    unsigned char payload[64];
    size_t        payload_len;
} Packet;

void process_packet(Packet *pkt) {
    printf("[net] Processing packet #%u (len=%zu)\\n",
           pkt->seq_number, pkt->payload_len);
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

    /* SECURED: free and nullify pointer */
    free(pkt);
    pkt = NULL;

    if (pkt != NULL) {
        printf("[main] Seq after free: %u\\n", pkt->seq_number);
    } else {
        printf("[main] Packet safely released.\\n");
    }
    return 0;
}`
  },
  {
    id: 'integer_overflow',
    name: 'integer_overflow.c',
    category: 'demo',
    cwe_id: 'CWE-190',
    vuln_type: 'Integer Overflow',
    severity: 'High',
    line: 20,
    description: '16-bit record count multiplied by element size overflows, resulting in an undersized malloc() allocation and subsequent heap overflow.',
    root_cause: 'Arithmetic multiplication wraps around before malloc() allocation',
    benign_arg: '10',
    exploit_arg: '32768',
    asan_trigger: 'UndefinedBehaviorSanitizer: signed integer overflow',
    strategy: 'template',
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
}`,
    patched_code: `/*
 * CWE-190: Integer Overflow in Buffer Size (REPAIRED)
 * =====================================================
 * File: integer_overflow.c
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

#define RECORD_SIZE 8

int process_telemetry_batch(uint16_t record_count, const unsigned char *data, size_t data_len) {
    /* SECURED: guard against integer wrap */
    if (record_count > (SIZE_MAX / RECORD_SIZE)) {
        fprintf(stderr, "[telemetry] Integer overflow in size calculation.\\n");
        return -1;
    }

    size_t buf_size = (size_t)record_count * RECORD_SIZE;
    if (buf_size == 0) {
        return -1;
    }

    unsigned char *buf = (unsigned char *)malloc(buf_size);
    if (!buf) {
        return -1;
    }

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

    process_telemetry_batch(count, fake_data, real_data_size);
    free(fake_data);
    return 0;
}`
  },
  {
    id: 'double_free',
    name: 'double_free.c',
    category: 'juliet',
    cwe_id: 'CWE-415',
    vuln_type: 'Double Free in Sensor Session',
    severity: 'High',
    line: 22,
    description: 'Freeing a resource twice triggers heap metadata corruption and arbitrary code execution.',
    root_cause: 'Pointer freed on error path then unconditionally freed again in cleanup block',
    benign_arg: 'normal_handshake',
    exploit_arg: 'force_error_trigger',
    asan_trigger: 'AddressSanitizer: attempting double-free on address 0x602000000010',
    strategy: 'llm',
    fix_description: 'Nullify pointer upon first free and check for non-NULL before cleanup invocation.',
    code: `/*
 * Juliet Test Suite CWE-415: Double Free
 * =====================================
 */
#include <stdio.h>
#include <stdlib.h>

void handle_sensor_session(int error_flag) {
    char *session_token = (char *)malloc(64);
    if (!session_token) return;

    if (error_flag) {
        printf("[session] Error encountered, aborting\\n");
        free(session_token);
        /* VULNERABLE: missing return or NULL assignment */
    }

    /* Cleanup block */
    printf("[session] Final cleanup\\n");
    free(session_token);
}

int main(int argc, char *argv[]) {
    handle_sensor_session(argc > 1 ? 1 : 0);
    return 0;
}`,
    patched_code: `/*
 * Juliet Test Suite CWE-415: Double Free (REPAIRED)
 * =====================================
 */
#include <stdio.h>
#include <stdlib.h>

void handle_sensor_session(int error_flag) {
    char *session_token = (char *)malloc(64);
    if (!session_token) return;

    if (error_flag) {
        printf("[session] Error encountered, aborting\\n");
        free(session_token);
        session_token = NULL;
        return;
    }

    /* Cleanup block */
    printf("[session] Final cleanup\\n");
    if (session_token != NULL) {
        free(session_token);
        session_token = NULL;
    }
}

int main(int argc, char *argv[]) {
    handle_sensor_session(argc > 1 ? 1 : 0);
    return 0;
}`
  },
  {
    id: 'oob_write',
    name: 'oob_write.c',
    category: 'juliet',
    cwe_id: 'CWE-787',
    vuln_type: 'Out-of-bounds Write in BLE Packet',
    severity: 'Critical',
    line: 19,
    description: 'Writing beyond the allocated array index corrupts memory.',
    root_cause: 'Unchecked index parameter allows array writes past buffer boundary',
    benign_arg: 'idx=2',
    exploit_arg: 'idx=64',
    asan_trigger: 'AddressSanitizer: global-buffer-overflow',
    strategy: 'template',
    fix_description: 'Added strict index bound check before element assignment.',
    code: `/*
 * CWE-787: Out-of-bounds Write
 * ==============================
 */
#include <stdio.h>

#define MAX_CHANNELS 8
static int channel_weights[MAX_CHANNELS];

void set_channel_weight(int index, int val) {
    /* VULNERABLE: index is not validated against bounds */
    channel_weights[index] = val;
    printf("[ble] Channel %d set to %d\\n", index, val);
}

int main(void) {
    set_channel_weight(2, 100);
    return 0;
}`,
    patched_code: `/*
 * CWE-787: Out-of-bounds Write (REPAIRED)
 * ==============================
 */
#include <stdio.h>

#define MAX_CHANNELS 8
static int channel_weights[MAX_CHANNELS];

void set_channel_weight(int index, int val) {
    /* SECURED: bounds validation guard */
    if (index < 0 || index >= MAX_CHANNELS) {
        fprintf(stderr, "[ble] Invalid channel index: %d\\n", index);
        return;
    }
    channel_weights[index] = val;
    printf("[ble] Channel %d set to %d\\n", index, val);
}

int main(void) {
    set_channel_weight(2, 100);
    return 0;
}`
  }
]

/**
 * Deliberate cheating patch demonstration:
 * LLM attempts to pass AddressSanitizer by simply dropping the vulnerable call
 * or returning early (bypassing execution). The M3 No-Cheating check must catch this!
 */
export const CHEATING_PATCH_EXAMPLE = {
  original_code: `void process_device_name(const char *input) {
    char device_name[32];
    strcpy(device_name, input);
    printf("[device] Name set to: %s\\n", device_name);
}`,
  cheating_patch_early_return: `void process_device_name(const char *input) {
    return; /* CHEAT: unconditional bypass to skip execution */
    char device_name[32];
    strcpy(device_name, input);
}`,
  cheating_patch_deletion: `void process_device_name(const char *input) {
    char device_name[32];
    /* CHEAT: completely deleted strcpy() without replacement! */
    printf("[device] Name set to: %s\\n", device_name);
}`,
  violations: [
    "Cheating violation: Patch inserts premature unconditional return/exit, bypassing execution.",
    "Cheating violation: Vulnerable function 'strcpy' was deleted without providing a bounded safe alternative (strncpy, snprintf, memcpy, strlcpy)."
  ]
}
