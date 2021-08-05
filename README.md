# Logic Gateway component

! This is a privileged component and is meant to be running globally. !

## What are Logic Gateways?
In combination with the Orchestrator, Logic gateways provide means for conditional flow execution.
Logic Gateways support a simple set of instructions and operations, that can also be nested in order to create more complex scenarios. This set is called a `rule`. The Logic Gateway processes the rule and can directly apply data emitted by previous nodes of the same flow to decide which node should be executed next. 
 

## Supported operations

This list will be gradually expanded.

### Operation types
* `CONDITION` - see conditionals and operations below
* `BRANCHING` - see branching

### Conditionals
* `AND`
* `OR`

### Operations

* `CONTAINS`
* `EQUALS`
* `IS_TRUTHY` - Check if a given string|object is truthy (not null, 0 or undefined)

### Branching
* `SWITCH` - Execute the first truthy branch
* `SPLIT` - Execute all branches
* `JOIN_ONE_OF`- Proceed if at least one of the branches was truthy
* `JOIN` - Wait for all branches to have executed

### Commands

-- Commands are passed directly to orchestrator, thus not uppercase as above. Work in progress --

* `void` - the orchestrator does nothing and awaits further commands
* `abort`
* `finish`
* `start-flow` – `parameters` should contain flowId:stepId
* `run-next`
* `run-next-steps`  - `parameters` should contain flowId:stepId

## How it works

1. Add this component as a step in a flow 
2. Define a logic instruction, and add it as `rule` to the `fields` object of current flow node
3. The orchestrator recognizes a logic gateway component and sends a special (privileged) token to it
4. Logic gateway fetches data for all steps of a current flow from the Snapshot Repository and applies the given logic instruction to it. (!) In order for this to work, affected flow nodes/components must post their snapshot explicitly to Snapshot Repository. This can be done by settings the `nodeSettings.autoSaveSnapshots` property in flow nodes. In the future, the orchestrator shall recognize if a flow contains a logic gateway and if so, then automatically send the output data of a flow step to Snapshot Repository with a `flowExecId`. 
5. Each logic instruction can have a `positive` and `negative` outcome `actions` defined.


## Special cases

### Looping
Check if a condition is met and if `negative`, then instruct the orchestrator via `start-flow` and `parameters` which previous step should be repeated.

### Waiting for a specific result/condition
Logic Gateway can emit a `void` to orchestrator, indicating that it should `idle` and do nothing. This may be useful if there are multiple incomming edges and the Logic Gateways should only allow execution of the next node when a rule condition is met.

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
