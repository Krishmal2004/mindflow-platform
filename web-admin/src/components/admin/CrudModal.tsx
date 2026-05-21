import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { TableConfig } from "@/lib/tableConfig";

interface CrudModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    mode: 'create' | 'edit';
    table: TableConfig;
    values: Record<string, any>;
    onChange: (field: string, value: any) => void;
}

export function CrudModal({ open, onClose, onSubmit, mode, table, values, onChange }: CrudModalProps) {
    const title = mode === 'create' ? 'Add Record' : 'Edit Record';
    const desc = `${mode === 'create' ? 'Insert a new record into' : 'Update existing record in'} the ${table.label} table. Fields marked * are required.`;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-white border border-neutral-200 rounded-xl shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-neutral-950 font-bold text-base">{title}</DialogTitle>
                    <DialogDescription className="text-neutral-500 text-xs">{desc}</DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 max-h-[58vh] overflow-y-auto pr-1">
                        {table.fields.map((field) => {
                            const isDisabled = mode === 'edit' && field.readOnly;
                            const val = values[field.name] ?? '';

                            return (
                                <div key={field.name} className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold text-neutral-700 flex items-center gap-1">
                                        {field.label}
                                        {field.required && <span className="text-red-500">*</span>}
                                        {isDisabled && <span className="text-neutral-400 font-normal">(read-only)</span>}
                                    </Label>

                                    {field.type === 'textarea' ? (
                                        <Textarea
                                            value={String(val)}
                                            onChange={(e) => onChange(field.name, e.target.value)}
                                            required={field.required}
                                            disabled={isDisabled}
                                            className="text-xs border-neutral-200 focus:ring-0 focus-visible:ring-0 bg-neutral-50 rounded-lg resize-none min-h-[72px]"
                                        />
                                    ) : field.type === 'select' ? (
                                        <Select
                                            value={String(val)}
                                            onValueChange={(v) => onChange(field.name, v)}
                                            disabled={isDisabled}
                                        >
                                            <SelectTrigger className="text-xs h-9 bg-neutral-50 border-neutral-200 rounded-lg focus:ring-0">
                                                <SelectValue placeholder="Select…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {field.options?.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : field.type === 'boolean' ? (
                                        <Select
                                            value={String(val === true || val === 'true' ? 'true' : 'false')}
                                            onValueChange={(v) => onChange(field.name, v === 'true')}
                                            disabled={isDisabled}
                                        >
                                            <SelectTrigger className="text-xs h-9 bg-neutral-50 border-neutral-200 rounded-lg focus:ring-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="true">True</SelectItem>
                                                <SelectItem value="false">False</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                            value={String(val)}
                                            onChange={(e) => onChange(field.name, e.target.value)}
                                            required={field.required}
                                            disabled={isDisabled}
                                            className="text-xs h-9 bg-neutral-50 border-neutral-200 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <DialogFooter className="pt-4 border-t border-neutral-100 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="text-xs border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            className="text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg shadow-sm"
                        >
                            {mode === 'create' ? 'Insert Record' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
