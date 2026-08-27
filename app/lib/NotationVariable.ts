export class NotionVariable {
    private type: 'number' | 'string';
    private label: string;
    protected value?: string;

    constructor(type: 'number' | 'string', label: string, defaultValue = '') {
        this.type = type;
        this.label = label;
        this.value = defaultValue;
    }

    public isNumber() {
        return this.type === 'number';
    }

    public getLabel() {
        return this.label;
    }

    public getValue() {
        return this.value;
    }

    public setValue(value: string) {
        if (this.isNumber())value = value.replace(/[a-zA-Z]/g, "")
        this.value = value;
    }

    clone(updatedFields?: Partial<{type: string, label: string, value: string}>): NotionVariable {
        let value = updatedFields?.value ?? '';
        if ((updatedFields && updatedFields?.type === 'number') || this.isNumber())value = value.replace(/[a-zA-Z]/g, "")
        return Object.assign(new NotionVariable(this.type, this.label, this.value), updatedFields, { value });
    }
}

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