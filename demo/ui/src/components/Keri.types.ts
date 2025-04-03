interface InceptionResponse {
    _serder: {
        _kind: string; // Serialization type (e.g., "JSON")
        _raw: string;  // Raw serialized message string
        _ked: {
            v: string; // Protocol version
            t: string; // Message type
            d: string; // Unique digest/identifier
            i: string; // Main identifier
            s: string; // Sequence number
            p: string; // Previous event digest
            a: Array<{
                i: string; // Identifier
                d: string; // Digest
            }>;        // Array of identifier-digest pairs
        };
        _ident: string; // Protocol identifier (e.g., "KERI")
        _size: number;  // Message size
        _version: {
            major: number; // Major version number
            minor: number; // Minor version number
        };
        _code: string; // Message code
    };
    _sigs: string[]; // Array of signature strings
    response: Record<string, any>;
}

export type {
    InceptionResponse
}