const SCHEMA_ACDC = {
  EGjD1gCLi9ecZSZp9zevkgZGyEX_MbOdmhBFt4o0wvdb: {
    $id: 'EGjD1gCLi9ecZSZp9zevkgZGyEX_MbOdmhBFt4o0wvdb',
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Domain registration credential',
    description: 'A credential issued for domain registration purposes',
    type: 'object',
    credentialType: 'DomainCredential',
    version: '1.0.0',
    properties: {
      v: {
        description: 'Version',
        type: 'string',
      },
      d: {
        description: 'Credential SAID',
        type: 'string',
      },
      u: {
        description: 'One time use nonce',
        type: 'string',
      },
      i: {
        description: 'Issuee AID',
        type: 'string',
      },
      ri: {
        description: 'Credential status registry',
        type: 'string',
      },
      s: {
        description: 'Schema SAID',
        type: 'string',
      },
      a: {
        oneOf: [
          {
            description: 'Attributes block SAID',
            type: 'string',
          },
          {
            $id: 'EBeI53glWgRv27Rt_r-D5aXIGBTPVO3jMV7QQKkQzA2n',
            description: 'Attributes block',
            type: 'object',
            properties: {
              d: {
                description: 'Attributes block SAID',
                type: 'string',
              },
              i: {
                description: 'Issuee AID',
                type: 'string',
              },
              dt: {
                description: 'Issuance date time',
                type: 'string',
                format: 'date-time',
              },
              domain: {
                description: 'The domain address',
                type: 'string',
              },
            },
            additionalProperties: false,
            required: ['i', 'dt', 'domain'],
          },
        ],
      },
    },
    additionalProperties: false,
    required: ['i', 'ri', 's', 'd'],
  },
};

export { SCHEMA_ACDC };
