/**
 * Null Safety Utilities for AegisWallet
 *
 * Provides comprehensive null-safe property access and validation utilities
 * to prevent runtime errors and improve type safety throughout the application.
 *
 * @version 1.0.0
 * @since 2025-12-02
 */

// ============================================================================
// Core Null Safety Functions
// ============================================================================

/**
 * Safely get nested property value with null checking
 * Prevents "Cannot read properties of null/undefined" errors
 */
export function safeGet<T, K extends keyof T>(
	obj: T | null | undefined,
	key: K,
): T[K] | null | undefined {
	if (!obj || obj === null || obj === undefined) {
		return undefined;
	}

	try {
		return obj[key];
	} catch {
		return undefined;
	}
}

/**
 * Safely get nested property with default fallback
 * Returns default value if property is null/undefined
 */
export function safeGetWithDefault<T, K extends keyof T>(
	obj: T | null | undefined,
	key: K,
	defaultValue: NonNullable<T[K]>,
): NonNullable<T[K]> {
	if (!obj || obj === null || obj === undefined) {
		return defaultValue;
	}

	try {
		const value = obj[key];
		return value !== null && value !== undefined ? value : defaultValue;
	} catch {
		return defaultValue;
	}
}

/**
 * Check if value is null or undefined
 * Type-safe null checking utility
 */
export function isNullish<T>(value: T | null | undefined): value is null | undefined {
	return value === null || value === undefined;
}

/**
 * Check if value is not null and not undefined
 * Type-safe non-null checking utility
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
	return value !== null && value !== undefined;
}

/**
 * Safely access array element with null checking
 * Prevents array access errors on empty/null arrays
 */
export function safeArrayGet<T>(
	array: T[] | null | undefined,
	index: number,
): T | null | undefined {
	if (!array || array === null || array === undefined) {
		return undefined;
	}

	if (index < 0 || index >= array.length) {
		return undefined;
	}

	return array[index] ?? undefined;
}

/**
 * Safely access object property with nested path
 * Supports dot notation paths like 'user.profile.name'
 */
export function safeNestedGet<T>(obj: T | null | undefined, path: string): unknown {
	if (!obj || obj === null || obj === undefined) {
		return undefined;
	}

	try {
		const keys = path.split('.');
		let current: unknown = obj;

		for (const key of keys) {
			if (current && typeof current === 'object' && key in current) {
				current = (current as Record<string, unknown>)[key];
			} else {
				return undefined;
			}
		}

		return current;
	} catch {
		return undefined;
	}
}

/**
 * Safely access object property with nested path and default
 */
export function safeNestedGetWithDefault<T>(
	obj: T | null | undefined,
	path: string,
	defaultValue: unknown,
): unknown {
	const value = safeNestedGet(obj, path);
	return value !== null && value !== undefined ? value : defaultValue;
}

// ============================================================================
// Financial Null Safety Utilities (Brazilian Context)
// ============================================================================

/**
 * Safely format Brazilian currency amount
 * Handles null/undefined values for BRL formatting
 */
export function safeCurrencyFormat(amount: number | null | undefined): string {
	if (isNullish(amount)) {
		return 'R$ 0,00';
	}

	try {
		return new Intl.NumberFormat('pt-BR', {
			currency: 'BRL',
			style: 'currency',
		}).format(amount);
	} catch {
		return 'R$ 0,00';
	}
}

/**
 * Safely format Brazilian date
 * Handles null/undefined dates for Brazilian locale
 */
export function safeDateFormat(date: Date | string | null | undefined): string {
	if (isNullish(date)) {
		return '';
	}

	try {
		if (date instanceof Date) {
			return date.toLocaleDateString('pt-BR');
		}
		return new Date(date).toLocaleDateString('pt-BR');
	} catch {
		return '';
	}
}

/**
 * Safely format Brazilian phone number
 * Handles null/undefined phone values with proper formatting
 */
export function safePhoneFormat(phone: string | null | undefined): string {
	if (isNullish(phone)) {
		return '';
	}

	const cleanPhone = phone.replace(/\D/g, '');

	if (cleanPhone.length === 11) {
		return `${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
	}
	if (cleanPhone.length === 10) {
		return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
	}

	return phone;
}

/**
 * Safely validate CPF (Brazilian tax ID)
 * Returns null-safe validation result
 */
export function safeCPFValidation(cpf: string | null | undefined): boolean {
	if (isNullish(cpf)) {
		return false;
	}

	const cleanCPF = cpf.replace(/\D/g, '');

	if (cleanCPF.length !== 11) {
		return false;
	}

	if (/^(\d)\1{10}$/.test(cleanCPF)) {
		return false;
	}

	// Basic CPF validation algorithm
	let sum = 0;
	for (let i = 1; i <= 9; i++) {
		sum += Number.parseInt(cleanCPF.substring(i - 1, i), 10) * (11 - i);
	}

	let remainder = (sum * 10) % 11;
	if (remainder === 10 || remainder === 11) {
		remainder = 0;
	}

	return remainder === Number.parseInt(cleanCPF.substring(9, 10), 10);
}

// ============================================================================
// Array and Collection Null Safety
// ============================================================================

/**
 * Safely filter array removing null/undefined values
 * Type-safe array filtering utility
 */
export function safeFilter<T>(
	array: (T | null | undefined)[] | null | undefined,
	predicate: (value: T) => boolean,
): T[] {
	if (!array || array === null || array === undefined) {
		return [];
	}

	return array.filter((item): item is T => isNotNullish(item) && predicate(item));
}

/**
 * Safely map array handling null/undefined values
 * Type-safe array mapping utility
 */
export function safeMap<T, U>(
	array: (T | null | undefined)[] | null | undefined,
	mapper: (value: T) => U,
): U[] {
	if (!array || array === null || array === undefined) {
		return [];
	}

	return array.filter((item): item is T => isNotNullish(item)).map(mapper);
}

/**
 * Safely reduce array handling null/undefined values
 * Type-safe array reduction utility
 */
export function safeReduce<T, U>(
	array: (T | null | undefined)[] | null | undefined,
	reducer: (acc: U, value: T) => U,
	initialValue: U,
): U {
	if (!array || array === null || array === undefined) {
		return initialValue;
	}

	return array.filter((item): item is T => isNotNullish(item)).reduce(reducer, initialValue);
}

/**
 * Safely find first matching element in array
 * Type-safe array find utility
 */
export function safeFind<T>(
	array: (T | null | undefined)[] | null | undefined,
	predicate: (value: T) => boolean,
): T | null | undefined {
	if (!array || array === null || array === undefined) {
		return undefined;
	}

	return array.find((item): item is T => isNotNullish(item) && predicate(item));
}

// ============================================================================
// Object Null Safety Utilities
// ============================================================================

/**
 * Safely merge objects handling null/undefined values
 * Type-safe object merging utility
 */
export function safeMerge<T extends Record<string, unknown>>(
	...objects: (T | null | undefined)[]
): T {
	const result: Record<string, unknown> = {};

	for (const obj of objects) {
		if (obj !== null && obj !== undefined) {
			for (const [key, value] of Object.entries(obj)) {
				result[key] = value;
			}
		}
	}

	return result as T;
}

/**
 * Safely pick properties from object
 * Type-safe object property picking utility
 */
export function safePick<T, K extends keyof T>(obj: T | null | undefined, keys: K[]): Pick<T, K> {
	if (!obj || obj === null || obj === undefined) {
		return {} as Pick<T, K>;
	}

	const result: Partial<T> = {};
	for (const key of keys) {
		const value = obj[key];
		if (value !== null && value !== undefined) {
			result[key] = value;
		}
	}

	return result as Pick<T, K>;
}

// ============================================================================
// String Null Safety Utilities
// ============================================================================

/**
 * Safely trim string handling null/undefined
 * Type-safe string trimming utility
 */
export function safeTrim(str: string | null | undefined): string {
	if (isNullish(str)) {
		return '';
	}

	return str.trim();
}

/**
 * Safely get string length handling null/undefined
 * Type-safe string length utility
 */
export function safeLength(str: string | null | undefined): number {
	if (isNullish(str)) {
		return 0;
	}

	return str.length;
}

/**
 * Safely check if string contains value handling null/undefined
 * Type-safe string contains utility
 */
export function safeContains(str: string | null | undefined, searchValue: string): boolean {
	if (isNullish(str) || isNullish(searchValue)) {
		return false;
	}

	return str.includes(searchValue);
}

/**
 * Safely convert string to number handling null/undefined
 * Type-safe string to number conversion utility
 */
export function safeToNumber(str: string | null | undefined, defaultValue = 0): number {
	if (isNullish(str)) {
		return defaultValue;
	}

	const parsed = Number.parseFloat(str.replace(/[R$\s.,]/g, '').replace(/,/g, '.'));
	return Number.isNaN(parsed) ? defaultValue : parsed;
}

// ============================================================================
// Error Handling Null Safety
// ============================================================================

/**
 * Wrap function with null-safe error handling
 * Prevents runtime errors from null/undefined inputs
 */
export function safeExecute<T extends (...args: unknown[]) => unknown>(
	fn: T,
	...args: Parameters<T>
): ReturnType<T> | null {
	try {
		return fn(...args) as ReturnType<T>;
	} catch {
		return null;
	}
}

/**
 * Create null-safe wrapper for async functions
 */
export async function safeExecuteAsync<T extends (...args: unknown[]) => Promise<unknown>>(
	fn: T,
	...args: Parameters<T>
): Promise<ReturnType<T> | null> {
	try {
		return (await fn(...args)) as ReturnType<T>;
	} catch {
		return Promise.resolve(null);
	}
}

// ============================================================================
// Type Guards for Null Safety
// ============================================================================

/**
 * Type guard to check if value is a non-null object
 */
export function isNonNullObject<T>(value: T | null | undefined): value is T {
	return value !== null && value !== undefined && typeof value === 'object' && value !== null;
}

/**
 * Type guard to check if value is a non-null string
 */
export function isNonNullString(value: unknown): value is string {
	return typeof value === 'string' && value !== null && value !== undefined;
}

/**
 * Type guard to check if value is a non-null number
 */
export function isNonNullNumber(value: unknown): value is number {
	return typeof value === 'number' && value !== null && value !== undefined && !Number.isNaN(value);
}

/**
 * Type guard to check if value is a non-null array
 */
export function isNonNullArray<T>(value: unknown): value is T[] {
	return Array.isArray(value) && value !== null && value !== undefined;
}

/**
 * Type guard to check if value is a non-null Date
 */
export function isNonNullDate(value: unknown): value is Date {
	return value instanceof Date && value !== null && value !== undefined;
}

// ============================================================================
// Brazilian Financial Context Null Safety
// ============================================================================

/**
 * Safely validate Brazilian financial institution code
 */
export function safeBankCodeValidation(code: string | null | undefined): boolean {
	if (isNullish(code)) {
		return false;
	}

	// Common Brazilian bank codes for validation
	const validBankCodes = new Set([
		'001',
		'033',
		'104',
		'237',
		'341',
		'260',
		'077',
		'021',
		'025',
		'036',
		'037',
		'039',
		'041',
		'062',
		'063',
		'064',
		'065',
		'066',
		'069',
		'070',
		'074',
		'075',
		'078',
		'083',
		'084',
		'085',
		'089',
		'102',
		'105',
		'107',
		'108',
		'109',
		'110',
		'111',
		'112',
		'114',
		'115',
		'116',
		'117',
		'118',
		'119',
		'120',
		'121',
		'122',
		'124',
		'125',
		'126',
		'127',
		'128',
		'129',
		'130',
		'131',
		'132',
		'133',
		'134',
		'135',
		'136',
		'137',
		'138',
		'139',
		'140',
		'141',
		'142',
		'143',
		'144',
		'145',
		'146',
		'147',
		'148',
		'149',
		'150',
		'151',
		'152',
		'153',
		'154',
		'155',
		'156',
		'157',
		'158',
		'159',
		'160',
		'161',
		'162',
		'163',
		'164',
		'165',
		'166',
		'167',
		'168',
		'169',
		'170',
		'171',
		'172',
		'173',
		'174',
		'175',
		'176',
		'177',
		'178',
		'179',
		'180',
		'181',
		'182',
		'183',
		'184',
		'185',
		'186',
		'187',
		'188',
		'189',
		'190',
		'191',
		'192',
		'193',
		'194',
		'195',
		'196',
		'197',
		'198',
		'199',
		'200',
		'201',
		'202',
		'203',
		'204',
		'205',
		'206',
		'207',
		'208',
		'209',
		'210',
		'211',
		'212',
		'213',
		'214',
		'215',
		'216',
		'217',
		'218',
		'219',
		'220',
		'221',
		'222',
		'223',
		'224',
		'225',
		'226',
		'227',
		'228',
		'229',
		'230',
		'231',
		'232',
		'233',
		'234',
		'235',
		'236',
		'237',
		'238',
		'239',
		'240',
		'241',
		'242',
		'243',
		'244',
		'245',
		'246',
		'247',
		'248',
		'249',
		'250',
		'251',
		'252',
		'253',
		'254',
		'255',
		'256',
		'257',
		'258',
		'259',
		'260',
		'261',
		'262',
		'263',
		'264',
		'265',
		'266',
		'267',
		'268',
		'269',
		'270',
		'271',
		'272',
		'273',
		'274',
		'275',
		'276',
		'277',
		'278',
		'279',
		'280',
		'281',
		'282',
		'283',
		'284',
		'285',
		'286',
		'287',
		'288',
		'289',
		'290',
		'291',
		'292',
		'293',
		'294',
		'295',
		'296',
		'297',
		'298',
		'299',
		'300',
		'301',
		'302',
		'303',
		'304',
		'305',
		'306',
		'307',
		'308',
		'309',
		'310',
		'311',
		'312',
		'313',
		'314',
		'315',
		'316',
		'317',
		'318',
		'319',
		'320',
		'321',
		'322',
		'323',
		'324',
		'325',
		'326',
		'327',
		'328',
		'329',
		'330',
		'331',
		'332',
		'333',
		'334',
		'335',
		'336',
		'337',
		'338',
		'339',
		'340',
		'341',
		'342',
		'343',
		'344',
		'345',
		'346',
		'347',
		'348',
		'349',
		'350',
		'351',
		'352',
		'353',
		'354',
		'355',
		'356',
		'357',
		'358',
		'359',
		'360',
		'361',
		'362',
		'363',
		'364',
		'365',
		'366',
		'367',
		'368',
		'369',
		'370',
		'371',
		'372',
		'373',
		'374',
		'375',
		'376',
		'377',
		'378',
		'379',
		'380',
		'381',
		'382',
		'383',
		'384',
		'385',
		'386',
		'387',
		'388',
		'389',
		'390',
		'391',
		'392',
		'393',
		'394',
		'395',
		'396',
		'397',
		'398',
		'399',
		'400',
		'401',
		'402',
		'403',
		'404',
		'405',
		'406',
		'407',
		'408',
		'409',
		'410',
		'411',
		'412',
		'413',
		'414',
		'415',
		'416',
		'417',
		'418',
		'419',
		'420',
		'421',
		'422',
		'423',
		'424',
		'425',
		'426',
		'427',
		'428',
		'429',
		'430',
		'431',
		'432',
		'433',
		'434',
		'435',
		'436',
		'437',
		'438',
		'439',
		'440',
		'441',
		'442',
		'443',
		'444',
		'445',
		'446',
		'447',
		'448',
		'449',
		'450',
		'451',
		'452',
		'453',
		'454',
		'455',
		'456',
		'457',
		'458',
		'459',
		'460',
		'461',
		'462',
		'463',
		'464',
		'465',
		'466',
		'467',
		'468',
		'469',
		'470',
		'471',
		'472',
		'473',
		'474',
		'475',
		'476',
		'477',
		'478',
		'479',
		'480',
		'481',
		'482',
		'483',
		'484',
		'485',
		'486',
		'487',
		'488',
		'489',
		'490',
		'491',
		'492',
		'493',
		'494',
		'495',
		'496',
		'497',
		'498',
		'499',
		'500',
		'501',
		'502',
		'503',
		'504',
		'505',
		'506',
		'507',
		'508',
		'509',
		'510',
		'511',
		'512',
		'513',
		'514',
		'515',
		'516',
		'517',
		'518',
		'519',
		'520',
		'521',
		'522',
		'523',
		'524',
		'525',
		'526',
		'527',
		'528',
		'529',
		'530',
		'531',
		'532',
		'533',
		'534',
		'535',
		'536',
		'537',
		'538',
		'539',
		'540',
		'541',
		'542',
		'543',
		'544',
		'545',
		'546',
		'547',
		'548',
		'549',
		'550',
		'551',
		'552',
		'553',
		'554',
		'555',
		'556',
		'557',
		'558',
		'559',
		'560',
		'561',
		'562',
		'563',
		'564',
		'565',
		'566',
		'567',
		'568',
		'569',
		'570',
		'571',
		'572',
		'573',
		'574',
		'575',
		'576',
		'577',
		'578',
		'579',
		'580',
		'581',
		'582',
		'583',
		'584',
		'585',
		'586',
		'587',
		'588',
		'589',
		'590',
		'591',
		'592',
		'593',
		'594',
		'595',
		'596',
		'597',
		'598',
		'599',
		'600',
		'601',
		'602',
		'603',
		'604',
		'605',
		'606',
		'607',
		'608',
		'609',
		'610',
		'611',
		'612',
		'613',
		'614',
		'615',
		'616',
		'617',
		'618',
		'619',
		'620',
		'621',
		'622',
		'623',
		'624',
		'625',
		'626',
		'627',
		'628',
		'629',
		'630',
		'631',
		'632',
		'633',
		'634',
		'635',
		'636',
		'637',
		'638',
		'639',
		'640',
		'641',
		'642',
		'643',
		'644',
		'645',
		'646',
		'647',
		'648',
		'649',
		'650',
		'651',
		'652',
		'653',
		'654',
		'655',
		'656',
		'657',
		'658',
		'659',
		'660',
		'661',
		'662',
		'663',
		'664',
		'665',
		'666',
		'667',
		'668',
		'669',
		'670',
		'671',
		'672',
		'673',
		'674',
		'675',
		'676',
		'677',
		'678',
		'679',
		'680',
		'681',
		'682',
		'683',
		'684',
		'685',
		'686',
		'687',
		'688',
		'689',
		'690',
		'691',
		'692',
		'693',
		'694',
		'695',
		'696',
		'697',
		'698',
		'699',
		'700',
		'701',
		'702',
		'703',
		'704',
		'705',
		'706',
		'707',
		'708',
		'709',
		'710',
		'711',
		'712',
		'713',
		'714',
		'715',
		'716',
		'717',
		'718',
		'719',
		'720',
		'721',
		'722',
		'723',
		'724',
		'725',
		'726',
		'727',
		'728',
		'729',
		'730',
		'731',
		'732',
		'733',
		'734',
		'735',
		'736',
		'737',
		'738',
		'739',
		'740',
		'741',
		'742',
		'743',
		'744',
		'745',
		'746',
		'747',
		'748',
		'749',
		'750',
		'751',
		'752',
		'753',
		'754',
		'755',
		'756',
		'757',
		'758',
		'759',
		'760',
		'761',
		'762',
		'763',
		'764',
		'765',
		'7766',
		'767',
		'768',
		'769',
		'770',
		'771',
		'772',
		'773',
		'774',
		'775',
		'776',
		'777',
		'778',
		'779',
		'780',
		'781',
		'782',
		'783',
		'784',
		'785',
		'786',
		'787',
		'788',
		'789',
		'790',
		'791',
		'792',
		'793',
		'794',
		'795',
		'796',
		'797',
		'798',
		'799',
		'800',
		'801',
		'802',
		'803',
		'804',
		'805',
		'806',
		'807',
		'808',
		'809',
		'810',
		'811',
		'812',
		'813',
		'814',
		'815',
		'816',
		'817',
		'818',
		'819',
		'820',
		'821',
		'822',
		'823',
		'824',
		'825',
		'826',
		'827',
		'828',
		'829',
		'830',
		'831',
		'832',
		'833',
		'834',
		'835',
		'836',
		'837',
		'838',
		'839',
		'840',
		'841',
		'842',
		'843',
		'844',
		'845',
		'846',
		'847',
		'848',
		'849',
		'850',
		'851',
		'852',
		'853',
		'854',
		'855',
		'856',
		'857',
		'858',
		'859',
		'860',
		'861',
		'862',
		'863',
		'864',
		'865',
		'866',
		'867',
		'868',
		'869',
		'870',
		'871',
		'872',
		'873',
		'874',
		'875',
		'876',
		'877',
		'878',
		'879',
		'880',
		'881',
		'882',
		'883',
		'884',
		'885',
		'886',
		'887',
		'888',
		'889',
		'890',
		'891',
		'892',
		'893',
		'894',
		'895',
		'896',
		'897',
		'898',
		'899',
		'900',
		'901',
		'902',
		'903',
		'904',
		'905',
		'906',
		'907',
		'908',
		'909',
		'910',
		'911',
		'912',
		'913',
		'914',
		'915',
		'916',
		'917',
		'918',
		'919',
		'920',
		'921',
		'922',
		'923',
		'924',
		'925',
		'926',
		'927',
		'928',
		'929',
		'930',
		'931',
		'932',
		'933',
		'934',
		'935',
		'936',
		'937',
		'938',
		'939',
		'940',
		'941',
		'942',
		'943',
		'944',
		'945',
		'946',
		'947',
		'948',
		'949',
		'950',
		'951',
		'952',
		'953',
		'954',
		'955',
		'956',
		'957',
		'958',
		'959',
		'960',
		'961',
		'962',
		'963',
		'964',
		'965',
		'966',
		'967',
		'968',
		'969',
		'970',
		'971',
		'972',
		'973',
		'974',
		'975',
		'976',
		'977',
		'978',
		'979',
		'980',
		'981',
		'982',
		'983',
		'984',
		'985',
		'986',
		'987',
		'988',
		'989',
		'990',
		'991',
		'992',
		'993',
		'994',
		'995',
		'996',
		'997',
		'998',
		'999',
	]);

	return validBankCodes.has(code);
}

/**
 * Safely validate PIX key format for Brazilian context
 */
export function safePixKeyValidation(key: string | null | undefined): boolean {
	if (isNullish(key)) {
		return false;
	}

	// PIX key patterns for different types
	const pixPatterns = {
		cpf: /^\d{11}$/,
		cnpj: /^\d{14}$/,
		email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		phone: /^\+?\d{10,15}$/,
		random: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i,
	};

	// Check against all patterns
	return Object.values(pixPatterns).some((pattern) => pattern.test(key));
}
