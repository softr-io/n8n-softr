import {
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
	IRequestOptions,
	NodeConnectionType,
} from 'n8n-workflow';
import { getDatabases, getTables, SOFTR_TABLES } from './softr.helpers';

export class SoftrTrigger implements INodeType {
	description: INodeTypeDescription = {
		name: 'softrTrigger',
		displayName: 'Softr Trigger',
		icon: 'file:softr.svg',
		group: ['trigger'],
		version: 1,
		description: 'Triggers when a Softr record is created or updated',
		defaults: {},
		credentials: [
			{
				name: 'softrApi',
				required: true,
			},
		],
		polling: true,
		inputs: [],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Database Name or ID',
				name: 'databaseId',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getDatabases',
				},
				default: '',
			},
			{
				displayName: 'Table Name or ID',
				name: 'tableId',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getTables',
					loadOptionsDependsOn: ['databaseId'],
				},
				default: '',
			},
			{
				displayName: 'Trigger On',
				name: 'eventType',
				type: 'options',
				description: 'Select the type of event to trigger on',
				options: [
					{
						name: 'Created Records',
						value: 'created',
						description: 'Trigger on new records in database',
					},
					{
						name: 'Updated Records',
						value: 'updated',
						description: 'Trigger on records update in database',
					},
				],
				default: 'created',
			},
			{
				displayName: 'Start Polling From',
				name: 'startTime',
				type: 'dateTime',
				default: '',
				required: true,
				description: 'Pick date and time to start polling from',
			},
			{
				displayName: 'Limit',
				name: 'batchSize',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				default: 10,
				description: 'Max number of results to return',
			},
		],
	};

	methods = {
		loadOptions: {
			async getDatabases(this: ILoadOptionsFunctions) {
				return getDatabases.call(this);
			},

			async getTables(this: ILoadOptionsFunctions) {
				const databaseId = this.getNodeParameter('databaseId', '') as string;
				if (!databaseId) {
					return [];
				}
				return getTables.call(this, databaseId);
			},
		},
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][]> {
		const databaseId = this.getNodeParameter('databaseId') as string;
		const tableId = this.getNodeParameter('tableId') as string;
		const eventType = this.getNodeParameter('eventType') as 'created' | 'updated';

		// read static data
		const staticData = this.getWorkflowStaticData('node');

		let payload: IDataObject;
		if (this.getMode() === 'manual') {
			// manual mode -> get the most recent record
			payload = {
				paging: { offset: 0, limit: 1 },
				sorting: [{ sortingField: 'created_at', sortType: 'DESC' }],
			};
		} else {
			// polling mode
			const field = eventType === 'created' ? 'created_at' : 'updated_at';
			const limit = this.getNodeParameter('batchSize') as number;
			const startTime = new Date(this.getNodeParameter('startTime') as string).getTime();
			const pollingStartTime = (staticData.lastTimeChecked || startTime) as number;
			payload = {
				filter: {
					condition: {
						operator: 'GREATER_THAN',
						leftSide: field,
						rightSide: pollingStartTime,
					},
				},
				paging: { offset: 0, limit: limit },
				sorting: [{ sortingField: 'created_at', sortType: 'ASC' }],
			};
		}

		let request: IRequestOptions = {
			method: 'POST',
			url: `${SOFTR_TABLES}/databases/${databaseId}/tables/${tableId}/records/search`,
			headers: { 'Content-Type': 'application/json' },
			body: payload,
			json: true,
		};
		const response = await this.helpers.requestWithAuthentication.call(this, 'softrApi', request);

		// Update lastTimeChecked with the maximum timestamp from the records
		if (this.getMode() != 'manual' && response.data.length > 0) {
			staticData.lastTimeChecked = getMaxTimestamp(response.data, eventType);
		}

		return [this.helpers.returnJsonArray(response.data)];
	}
}

// get max created_at / updated_at timestamp from the records
function getMaxTimestamp(data: any[], eventType: string): number {
	// response fields are formated in camelCase
	const field = eventType === 'created' ? 'createdAt' : 'updatedAt';
	// get max ISO timestamp from the records and format to milliseconds
	return Math.max(...data.map((r) => new Date(r[field]).getTime()));
}
