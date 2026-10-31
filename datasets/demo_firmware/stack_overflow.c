/*
 * CWE-121: Stack Buffer Overflow
 * ================================
 * File: stack_overflow.c
 *
 * Vulnerability:
 *   strcpy() copies user-supplied input into a fixed-size 32-byte stack
 *   buffer without any bounds check.  If the input exceeds 31 bytes, it
 *   will corrupt adjacent stack memory, potentially overwriting the return
 *   address and enabling arbitrary code execution.
 *
 * Compile to trigger ASan:
 *   gcc -fsanitize=address,undefined -g -o stack_overflow stack_overflow.c
 *   ./stack_overflow "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
 *
 * Expected ASan output:
 *   ERROR: AddressSanitizer: stack-buffer-overflow
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* Simulates a firmware function that reads a device name from user/network input */
void process_device_name(const char *input) {
    char device_name[32];  /* Fixed-size buffer — no room for >31 chars + NUL */

    /* VULNERABLE: no bounds check */
    strcpy(device_name, input);

    printf("[device] Name set to: %s\n", device_name);
}

int main(int argc, char *argv[]) {
    const char *input = (argc > 1) ? argv[1] : "IoTDevice-001";
    printf("[main] Processing device name: %s\n", input);
    process_device_name(input);
    printf("[main] Done.\n");
    return 0;
}
