import React, { useEffect, useState } from 'react'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Position } from './NotationForm';
import { useCookies } from 'react-cookie';

function UserInputDialog() {
    const [cookies, setCookie, removeCookie] = useCookies(['position', 'eid']);
    const [open, setOpen] = useState(!cookies.eid||!cookies.position);
    const [position, setPosition] = useState<Position | ''>(cookies.position ?? '')
    const [eid, setEid] = useState<string>(cookies.eid ?? '')

    useEffect(() => {
        if (!cookies.eid||!cookies.position)
            setOpen(true)
    }, [cookies])

    function submit() {
        if (!position||!eid)return;
        setCookie('eid', eid)
        setCookie('position', position)
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={value => setOpen(value)}>
            <DialogContent>
                    <DialogTrigger render={<Button variant="outline">Open Dialog</Button>} />
                    <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Employee Information</DialogTitle>
                            <DialogDescription>
                                Please provide your employee information.
                            </DialogDescription>
                        </DialogHeader>
                        <FieldGroup>
                            <Field>
                                <Label htmlFor="name-1">EID</Label>
                                <Input id="name-1" name="name" placeholder='Enter EID' value={eid} defaultValue={cookies.eid} onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    if (!isValidPartialInput(value))return;
                                    setEid(value)
                                    }} />
                            </Field>
                            <Field>
                                <Label htmlFor="role-1">Role</Label>
                                <div id="role-1" className="flex gap-2">
                                    {(['HPX', 'Core'] as Position[]).map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            defaultValue={cookies.position}
                                            onClick={() => setPosition(prev => prev === p ? '' : p)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${position === p
                                                ? 'bg-[#CC0000] border-[#CC0000] text-white shadow-sm'
                                                : 'bg-white border-gray-200 text-gray-500 hover:border-[#CC0000] hover:text-[#CC0000]'
                                                }`}
                                        >
                                            {p === 'HPX' ? 'High Priority' : 'Core'}
                                        </button>
                                    ))}
                                </div>
                            </Field>
                        </FieldGroup>
                        <DialogFooter>
                            <Button type="submit" onClick={() => submit()}>Save</Button>
                        </DialogFooter>
                    </DialogContent>
            </DialogContent>
        </Dialog>
    )
}

function isValidPartialInput(input: string): boolean {
  // 1. Enforce max length of 6 characters
  if (input.length > 6) return false;

  // 2. Loop through each character currently typed
  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (i < 3) {
      // The first 3 slots (indexes 0, 1, 2) MUST be letters
      if (!/[A-Za-z]/.test(char)) return false;
    } else {
      // The next 3 slots (indexes 3, 4, 5) MUST be numbers
      if (!/\d/.test(char)) return false;
    }
  }

  // If it passed all checks for the current length, it's on the right path!
  return true;
}

export default UserInputDialog
