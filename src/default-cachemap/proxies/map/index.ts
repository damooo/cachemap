export class MapProxy {
  private _cacheType: string;
  private _map = new Map();

  constructor(cacheType: string) {
    this._cacheType = cacheType;
  }

  get cacheType(): string {
    return this._cacheType;
  }

  public async clear(): Promise<void> {
    this._map.clear();
  }

  public async delete(key: string): Promise<boolean> {
    return this._map.delete(key);
  }

  public async entries(keys?: string[]): Promise<Array<[string, any]>> {
    const entries = this._map.entries();
    if (!keys) return Array.from(entries);
    const filtered: Array<[string, any]> = [];

    for (const [key, value] of entries) {
      if (keys.find((val) => val === key)) filtered.push([key, value]);
    }

    return filtered;
  }

  public async get(key: string): Promise<any> {
    return this._map.get(key);
  }

  public async has(key: string): Promise<boolean> {
    return this._map.get(key) !== undefined;
  }

  public async import(entries: Array<[string, any]>): Promise<void> {
    this._map = new Map([...this._map, ...entries]);
  }

  public async set(key: string, value: any): Promise<void> {
    this._map.set(key, value);
  }

  public async size(): Promise<number> {
    return this._map.size;
  }
}
