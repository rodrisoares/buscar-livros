export interface DataAdapter<TExternal, TInternal> {
	transform: (external: TExternal) => TInternal;
	transformArray: (external: TExternal[]) => TInternal[];
}

export abstract class BaseAdapter<TExternal, TInternal>
	implements DataAdapter<TExternal, TInternal>
{
	abstract transform(external: TExternal): TInternal;

	transformArray(external: TExternal[]): TInternal[] {
		return external.map((item) => this.transform(item));
	}
}
