import {
	IAuthenticateGeneric,
	Icon,
	IconFile,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Themed,
} from 'n8n-workflow';

export class SoftrApi implements ICredentialType {
	name = 'softrApi';
	displayName = 'Softr API';
	documentationUrl = 'https://docs.softr.io';
	icon: Icon = {
		light: 'file:softr.svg',
		dark: 'file:softr.svg',
	} as Themed<IconFile>;
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Softr-Api-Key': '={{$credentials.apiKey}}',
			},
		},
	};
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://tables-api.softr.io/api/v1',
			url: '/databases',
		},
	};
}
