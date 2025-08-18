import { INodeProperties } from 'n8n-workflow';

export const databaseRLC: INodeProperties = {
	displayName: 'Database',
	name: 'databaseId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			typeOptions: {
				searchListMethod: 'searchDatabases',
				searchable: true,
			},
		},
		{
			displayName: 'By URL',
			name: 'url',
			type: 'string',
			hint: 'Enter a URL',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^https://studio\\.softr\\.io/databases/[a-f0-9-]+(\\?.*)?$',
						errorMessage: 'Invalid URL',
					},
				},
			],
			placeholder: 'https://studio.softr.io/databases/1eb6781b-dbbf-4757-863c-6ac9be52f3d3',
			// How to get the ID from the URL
			extractValue: {
				type: 'regex',
				regex: '^https://studio\\.softr\\.io/databases/([a-f0-9-]+)',
			},
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			hint: 'Enter an ID',
			placeholder: '1eb6781b-dbbf-4757-863c-6ac9be52f3d3',
			url: '=https://studio.softr.io/databases/{{$value}}',
		},
	]
};

export const tableRLC: INodeProperties = {
	displayName: 'Table',
	name: 'tableId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	typeOptions: {
		loadOptionsDependsOn: ['databaseId.value'],
	},
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			typeOptions: {
				searchListMethod: 'searchTables',
				searchable: true,
			},
		},
		{
			displayName: 'By URL',
			name: 'url',
			type: 'string',
			placeholder: 'https://studio.softr.io/databases/...?...&table=HamBuoPnm0UMGw',
			hint: 'Enter a URL',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^https://studio\\.softr\\.io/databases/[a-f0-9-]+\\?table=[a-zA-Z0-9]+.*$',
						errorMessage: 'URL must contain a valid table ID in the "table" query parameter',
					},
				},
			],
			extractValue: {
				type: 'regex',
				regex: '^.*[?&]table=([a-zA-Z0-9]+)',
			},
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			hint: 'Enter an ID',
			placeholder: 'HamBuoPnm0UMGw',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^[a-zA-Z0-9]+$',
						errorMessage: 'Table ID must be alphanumeric',
					},
				},
			],
		},
	]
};
