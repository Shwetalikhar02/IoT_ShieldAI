/*
 * CWE-476: NULL Pointer Dereference
 * ===================================
 * File: null_ptr_deref.c
 *
 * Vulnerability:
 *   malloc() can return NULL if the system is out of memory.  The code
 *   does not check the return value before dereferencing the pointer.
 *   On resource-constrained IoT devices (SRAM often < 256 KB) this is a
 *   realistic and dangerous omission.
 *
 * Compile to trigger ASan:
 *   gcc -fsanitize=address,undefined -g -o null_ptr_deref null_ptr_deref.c
 *   # To simulate OOM, set a low ulimit or use a mock malloc in tests.
 *
 * Note:
 *   The vulnerability is also visible with -fsanitize=null on some compilers.
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
    /* Provide a small buffer to trigger the NULL path in a test scenario */
    unsigned char raw[sizeof(SensorReading)];
    memset(raw, 0, sizeof(raw));

    /* Populate dummy values */
    SensorReading *r = parse_sensor_packet(raw, sizeof(raw));

    if (r) {
        printf("[sensor] temp=%.2f hum=%.2f loc=%s\n",
               r->temperature, r->humidity, r->location);
        free(r);
    } else {
        printf("[sensor] Failed to parse packet.\n");
    }
    return 0;
}
