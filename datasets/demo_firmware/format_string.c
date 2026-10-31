/*
 * CWE-134: Use of Externally-Controlled Format String
 * ====================================================
 * File: format_string.c
 *
 * Vulnerability:
 *   User-supplied data is passed directly as the format argument to printf().
 *   An attacker can inject format specifiers (%x, %n, %s) to:
 *     - Read arbitrary memory (%x, %s)
 *     - Write arbitrary memory (%n) — code execution on some platforms
 *     - Crash the device (%s with invalid pointer)
 *
 * This is particularly dangerous in IoT devices logging to UART/serial,
 * where the "user" might be a remote attacker via a network interface.
 *
 * Compile to trigger ASan:
 *   gcc -fsanitize=address,undefined -g -o format_string format_string.c
 *   ./format_string "%x %x %x %x %x %x %x %x"
 *
 * Expected output: stack/heap addresses leaked via %x specifiers.
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
    printf("\n");
}

int main(int argc, char *argv[]) {
    const char *payload = (argc > 1) ? argv[1] : "Sensor event received";
    printf("[main] Logging event payload...\n");
    log_event(payload);
    printf("[main] Done.\n");
    return 0;
}
