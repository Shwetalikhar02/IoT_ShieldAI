/*
 * CWE-190: Integer Overflow in Buffer Size Calculation
 * =====================================================
 * File: integer_overflow.c
 *
 * Vulnerability:
 *   A 16-bit (uint16_t) count value supplied from a network packet header
 *   is multiplied by a fixed record size before being passed to malloc().
 *   If count is large enough, the multiplication wraps around to a small
 *   (or even zero) value due to integer overflow, allocating a buffer that
 *   is far too small for the subsequent memcpy() — leading to a heap
 *   buffer overflow.
 *
 *   Example: count = 65535, record_size = 2
 *     65535 * 2 = 131070 → wraps to 65534 on uint16_t (16-bit overflow)
 *     But on platforms where size_t is 16-bit (many IoT MCUs): 65534 * ... 
 *
 * Compile to trigger ASan:
 *   gcc -fsanitize=address,undefined -g -o integer_overflow integer_overflow.c
 *   ./integer_overflow 32768
 *
 * Expected ASan output:
 *   runtime error: signed integer overflow  (UBSan)
 *   or: ERROR: AddressSanitizer: heap-buffer-overflow
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
        fprintf(stderr, "[telemetry] Invalid batch size (0 bytes requested).\n");
        return -1;
    }

    unsigned char *buf = (unsigned char *)malloc(buf_size);
    if (!buf) {
        fprintf(stderr, "[telemetry] malloc failed.\n");
        return -1;
    }

    /* Copies data_len bytes into a potentially undersized buffer */
    size_t copy_len = (data_len < buf_size) ? data_len : buf_size;
    memcpy(buf, data, copy_len);

    printf("[telemetry] Processed %u records (%zu bytes).\n", record_count, copy_len);

    free(buf);
    return 0;
}

int main(int argc, char *argv[]) {
    uint16_t count = (argc > 1) ? (uint16_t)atoi(argv[1]) : 10;

    /* Simulate a data block of the claimed size */
    size_t real_data_size = (size_t)count * RECORD_SIZE;
    unsigned char *fake_data = (unsigned char *)malloc(real_data_size ? real_data_size : 1);
    if (!fake_data) { return 1; }
    memset(fake_data, 0xAB, real_data_size);

    printf("[main] Sending batch: count=%u\n", count);
    process_telemetry_batch(count, fake_data, real_data_size);

    free(fake_data);
    return 0;
}
