/**
 * A single fill-in-the-blank placeholder attached to an ACTION_OPTIONS entry's `variableLabel`
 * (e.g. the `%last4From%` in "transfer of funds from ACCT #%last4From%"). Instances live as the
 * static template data in notationData.ts and must be `clone()`d before a rep edits one, so that
 * filling in a value for one call never mutates the shared template used by every other call.
 */
export class NotionVariable {
    private type: 'number' | 'string';
    private label: string;
    /** The rep-entered value substituted into the notation text; undefined/empty until filled in. */
    protected value?: string;

    constructor(type: 'number' | 'string', label: string, defaultValue = '') {
        this.type = type;
        this.label = label;
        this.value = defaultValue;
    }

    public isNumber() {
        return this.type === 'number';
    }

    /** The human-readable prompt shown next to this variable's input. */
    public getLabel() {
        return this.label;
    }

    public getValue() {
        return this.value;
    }

    /** Sets the value, stripping letters when this is a 'number' variable so digit-only input is enforced. */
    public setValue(value: string) {
        if (this.isNumber())value = value.replace(/[a-zA-Z]/g, "")
        this.value = value;
    }

    /** Returns a fresh, independent copy (see class doc) — optionally overriding type/label/value. */
    clone(updatedFields?: Partial<{type: string, label: string, value: string}>): NotionVariable {
        let value = updatedFields?.value ?? '';
        if ((updatedFields && updatedFields?.type === 'number') || this.isNumber())value = value.replace(/[a-zA-Z]/g, "")
        return Object.assign(new NotionVariable(this.type, this.label, this.value), updatedFields, { value });
    }
}

/**
 * A variant of NotionVariable that toggles between two fixed text values (e.g. "Yes"/"No",
 * "EXT"/"INT") instead of accepting free-form input — rendered in the UI as a checkbox.
 */
export class NotionBooleanVariable extends NotionVariable {
    private on: string;
    private off: string;

    constructor(label: string, on: string, off: string) {
        super('string', label, off)
        this.on = on;
        this.off = off;
    }

    public getOnValue() {
        return this.on;
    }

    public getOffValue() {
        return this.off;
    }

    public turnOn() {
        this.value = this.on;
    }

    public turnOff() {
        this.value = this.off;
    }

    public isOn() {
        return this.value === this.on;
    }

    public toggle() {
        this.isOn() ? this.turnOff() : this.turnOn();
    }

    clone(): NotionBooleanVariable {
        const cloned = new NotionBooleanVariable(this.getLabel(), this.on, this.off);
        if (this.value !== undefined) cloned.setValue(this.value);
        return cloned;
    }
}
