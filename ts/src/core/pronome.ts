import type { RoleId } from "./types";


export class Pronome<T>  {
  private readonly _roleId: RoleId;
  private readonly _value: T;

  constructor(roleId: RoleId, value: T) {
    this._roleId = roleId;
    this._value = value;
  }

  get roleId() {
    return this._roleId;
  }

  get value() {
    return this._value;
  }

  bind(value: T) {
    return new Pronome<T>(this.roleId, value);
  }
}
