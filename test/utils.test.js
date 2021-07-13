/* eslint no-unused-expressions: "off" */

const { expect } = require('chai');
const nock = require('nock');
const { getSnapshotDataForFlow } = require('../lib/utils/helpers');
const { LogicGateway } = require('../lib/main/LogicGate');

const simpleRuleWithCondition = {
  type: 'CONDITION',
  subtype: 'AND',
  operands: [
    {
      type: 'operation',
      operation: 'EQUALS',
      key: {
        type: 'ref',
        data: {
          flowId: 123,
          stepId: 0,
          field: 'username',
        },
      },
      value: {
        type: 'string',
        data: 'hello@example.com',
      },
    },
    {
      type: 'operation',
      key: {
        type: 'ref',
        data: {
          flowId: 123,
          stepId: 1,
          field: 'tenant.name',
        },
      },
      operation: 'CONTAINS',
      value: {
        type: 'regex',
        data: {
          value: 'example',
          flags: 'i',
        },
      },
    },
  ],
  actions: {
    positive: {
      command: 'run-next-steps',
      parameters: ['flowId123:step_5'],
    },
    negative: {
      command: 'abort',
      parameters: [],
    },
  },
};

const complexBranchingExample = {
  type: 'BRANCHING',
  subtype: 'SWITCH',
  options: [
    {
      type: 'CONDITION',
      subtype: 'OR',
      operands: [
        {
          type: 'operation',
          operation: 'EQUALS',
          key: {
            type: 'ref',
            data: {
              flowId: 123,
              stepId: 0,
              field: 'username',
            },
          },
          value: {
            type: 'string',
            data: 'testing123@example.com',
          },
        },
        {
          type: 'operation',
          key: {
            type: 'ref',
            data: {
              flowId: 123,
              stepId: 1,
              field: 'tenant.unknownfield',
            },
          },
          operation: 'CONTAINS',
          value: {
            type: 'regex',
            data: {
              value: 'example',
              flags: 'i',
            },
          },
        },
      ],
      action: {
        command: 'run-next-steps',
        parameters: ['flowId123:step_4'],
      },

    },
    {
      type: 'CONDITION',
      subtype: 'AND',
      operands: [
        {
          type: 'operation',
          operation: 'EQUALS',
          key: {
            type: 'ref',
            data: {
              flowId: 123,
              stepId: 1,
              field: 'username',
            },
          },
          value: {
            type: 'string',
            data: 'hello@example.com',
          },
        },
        {
          type: 'operation',
          operation: 'EQUALS',
          key: {
            type: 'ref',
            data: {
              flowId: 123,
              stepId: 2,
              field: 'tenant.zip',
            },
          },
          value: {
            type: 'string',
            data: 55779,
          },
        },
      ],
      action: {
        command: 'run-next-step',
        parameters: [],
      },
    },
  ],
  default: {
    action: {
      command: 'void',
      parameters: [],
    },
  },
};

const snapshotDataDummy = {
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
};
const flowId = 123;

describe('Action Exec', () => {
  it('should fetch snapshot content', async () => {
    nock('https://snapshots.openintegrationhub.com')
      .get(`/snapshots/flows/${flowId}/steps`)
      .reply(200, snapshotDataDummy);

    const snapshotData = await getSnapshotDataForFlow({ flowId, iamToken: '123' });
    console.log('Token received', snapshotData);
    expect(snapshotData.data.length).to.equal(snapshotDataDummy.data.length);
  });

  it('should exec positive outcome for a rule', async () => {
    const logicGateway = new LogicGateway({ rule: simpleRuleWithCondition, snapshotData: snapshotDataDummy.data });
    const logicGateway2 = new LogicGateway({ rule: complexBranchingExample, snapshotData: snapshotDataDummy.data });
    const result = logicGateway.process();
    const result2 = logicGateway2.process();
    console.log(result);
    console.log(result2);
    expect(result.command).to.equal(simpleRuleWithCondition.actions.positive.command);
    expect(result2.command).to.equal(complexBranchingExample.options[1].action.command);
  });

  it('should exec negative outcome on error or unmatch', async () => {
    const mismatch = { ...simpleRuleWithCondition };
    const mismatch2 = { ...complexBranchingExample };
    mismatch.operands[0].value.data = 'fail';
    mismatch2.options[1].operands[1].value.data = 'fail';
    const logicGateway = new LogicGateway({ rule: mismatch, snapshotData: snapshotDataDummy.data });
    const logicGateway2 = new LogicGateway({ rule: mismatch2, snapshotData: snapshotDataDummy.data });
    const result = logicGateway.process();
    const result2 = logicGateway2.process();
    console.log(result);
    console.log(result2);
    expect(result.command).to.equal(simpleRuleWithCondition.actions.negative.command);
    expect(result2.command).to.equal(complexBranchingExample.default.action.command);
  });
});
