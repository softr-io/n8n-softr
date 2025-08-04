import {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	IPollFunctions,
	IRequestOptions,
} from 'n8n-workflow';

export const SOFTR_TABLES = 'https://tables-api.softr.io/api/v1';
export const SOFTR_STUDIO_USERS = 'https://studio-api.softr.io/v1/api/users';

export async function apiRequest(
	this: IExecuteFunctions | IPollFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query?: IDataObject,
	uri?: string,
	option: IDataObject = {},
) {
	query = query || {};

	const options: IRequestOptions = {
		headers: {} as IDataObject,
		method,
		body,
		qs: query,
		uri: uri || `https://tables-api.softr.io/api/v1/${endpoint}`,
		useQuerystring: false,
		json: true,
	};

	if (Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}
	if (Object.keys(body).length === 0) {
		delete options.body;
	} else {
		options.headers = {'Content-Type': 'application/json'};
	}
	return await this.helpers.requestWithAuthentication.call(this, 'softrApi', options);
}
