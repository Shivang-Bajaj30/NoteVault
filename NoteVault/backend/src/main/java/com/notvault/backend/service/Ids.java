package com.notvault.backend.service;

/** Tiny readable-id generator shared across services. */
public final class Ids {

    private static final long BASE = System.currentTimeMillis() % 1_000_000 * 1000;
    private static long counter = BASE;

    private Ids() {
    }

    public static synchronized String next(String prefix) {
        return prefix + "-" + ++counter;
    }
}
