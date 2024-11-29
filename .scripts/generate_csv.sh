#!/bin/bash

OUTPUT_FILE="large_file.csv"
NUM_ROWS=250000

echo "Name, Age, Address, Phone" > $OUTPUT_FILE

for i in $(seq 1 $NUM_ROWS); do
    NAME="Name$i"
    AGE=$((RANDOM % 100 + 18))
    ADDRESS="Address $i, Street $i"
    PHONE="123-456-789$i"

    echo "$NAME, $AGE, $ADDRESS, $PHONE" >> $OUTPUT_FILE
done

echo "CSV file $OUTPUT_FILE generated with $NUM_ROWS rows."
