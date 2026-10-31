/*
 * CWE-416: Use After Free
 * ========================
 * File: use_after_free.c
 *
 * Vulnerability:
 *   A heap-allocated packet buffer is freed after processing, but a stale
 *   pointer to the same memory is subsequently dereferenced.  In IoT firmware
 *   this can arise when a connection callback and a timeout handler both hold
 *   pointers to the same dynamically-allocated message struct.
 *
 * Compile to trigger ASan:
 *   gcc -fsanitize=address,undefined -g -o use_after_free use_after_free.c
 *   ./use_after_free
 *
 * Expected ASan output:
 *   ERROR: AddressSanitizer: heap-use-after-free
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
    printf("[net] Processing packet #%u (len=%zu)\n",
           pkt->seq_number, pkt->payload_len);
}

/* Simulates a "free on disconnect" event handler */
void on_disconnect(Packet *pkt) {
    free(pkt);
    printf("[net] Packet buffer freed after disconnect.\n");
}

int main(void) {
    Packet *pkt = (Packet *)malloc(sizeof(Packet));
    if (!pkt) {
        fprintf(stderr, "[main] malloc failed\n");
        return 1;
    }

    pkt->seq_number  = 42;
    pkt->payload_len = 5;
    memcpy(pkt->payload, "hello", 5);

    process_packet(pkt);

    /* Simulate disconnect freeing the packet */
    on_disconnect(pkt);

    /* VULNERABLE: pkt is now freed but still dereferenced below */
    printf("[main] Seq after free: %u\n", pkt->seq_number);

    return 0;
}
