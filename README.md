# Logic Gateway component

! This is a privileged component and is meant to be running globally. !

## How it works

* Add this component as a step in flow 
* Define a logic instruction, and it to the flow step fields as `rule`
* The orchestrator recognizes a logic gateway component and send a special (privileged) token to it
* Logic gateway fetches data for all steps of a current flow from the Snapshot Repository and applies the given logic instruction to it. (!) Currently, flow components must post their snapshot explicitly to Snapshot Repository. In the future, the orchestrator shall recognize if a flow contains a logic gateway and if so, then automatically send the output data of a flow step to Snapshot Repository with a `flowExecId`. 
* Each logic instruction should have a `positive` and `negative` outcome `actions` defined.

## An example of a simple logic instruction

```json
{
  "type": "CONDITION",
  "subtype": "AND",
  "operands": [
    {
      "type": "operation",
      "operation": "EQUALS",
      "key": {
        "type": "ref",
        "data": {
          "flowId": 123,
          "stepId": 0,
          "field": "username"
        }
      },
      "value": {
        "type": "string",
        "data": "hello@example.com"
      }
    },
    {
      "type": "operation",
      "key": {
        "type": "ref",
        "data": {
          "flowId": 123,
          "stepId": 1,
          "field": "tenant.name"
        }
      },
      "operation": "CONTAINS",
      "value": {
        "type": "regex",
        "data": {
          "value": "example",
          "flags": "i"
        }
      }
    }
  ],
  "actions": {
    "positive": {
      "command": "run-next-steps",
      "parameters": [
        "flowId123:step_5"
      ]
    },
    "negative": {
      "command": "abort",
      "parameters": []
    }
  }
}

```

### Complex example with branching and conditionals

```json
{
  "type": "BRANCHING",
  "subtype": "SWITCH",
  "options": [
    {
      "type": "CONDITION",
      "subtype": "OR",
      "operands": [
        {
          "type": "operation",
          "operation": "EQUALS",
          "key": {
            "type": "ref",
            "data": {
              "flowId": 123,
              "stepId": 0,
              "field": "username"
            }
          },
          "value": {
            "type": "string",
            "data": "testing123@example.com"
          }
        },
        {
          "type": "operation",
          "key": {
            "type": "ref",
            "data": {
              "flowId": 123,
              "stepId": 1,
              "field": "tenant.unknownfield"
            }
          },
          "operation": "CONTAINS",
          "value": {
            "type": "regex",
            "data": {
              "value": "example",
              "flags": "i"
            }
          }
        }
      ],
      "action": {
        "command": "run-next-steps",
        "parameters": [
          "flowId123:step_4"
        ]
      }
    },
    {
      "type": "CONDITION",
      "subtype": "AND",
      "operands": [
        {
          "type": "operation",
          "operation": "EQUALS",
          "key": {
            "type": "ref",
            "data": {
              "flowId": 123,
              "stepId": 1,
              "field": "username"
            }
          },
          "value": {
            "type": "string",
            "data": "hello@example.com"
          }
        },
        {
          "type": "operation",
          "operation": "EQUALS",
          "key": {
            "type": "ref",
            "data": {
              "flowId": 123,
              "stepId": 2,
              "field": "tenant.zip"
            }
          },
          "value": {
            "type": "string",
            "data": 55779
          }
        }
      ],
      "action": {
        "command": "run-next-step",
        "parameters": []
      }
    }
  ],
  "default": {
    "action": {
      "command": "void",
      "parameters": []
    }
  }
}

```

An example of a snapshot data used for the two examples above

```js
{
  data: [
    {
      flowId: 123,
      flowExecId: 7,
      stepId: 0,
      snapshot: {
        username: 'hello@example.com',
        firstname: 'HellO',
      },
    },
    {
      flowId: 123,
      flowExecId: 7,
      stepId: 1,
      snapshot: {
        username: 'hello@example.com',
        firstname: 'HellO',
        tenant: {
          name: 'Example Inc.',
        },
      },
    },
    {
      flowId: 123,
      flowExecId: 7,
      stepId: 2,
      snapshot: {
        username: 'hello@example.com',
        firstname: 'HellO',
        tenant: {
          name: 'Example Inc.',
          zip: 55779,
        },
      },
    },
  ],
}
```
