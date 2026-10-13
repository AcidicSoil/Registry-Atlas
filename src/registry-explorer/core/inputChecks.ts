import type { RawJsonInput } from './jsonInput';
/** Zod parsed input guards, for schema-boundary values before domain dispatch. */
import { z } from 'zod';

type RawInput = z.input<z.ZodUnknown>;

const stringInput = z.string();

const numberInput = z.number();

const booleanInput = z.boolean();

const functionInput = z.function();

const objectInput = z.union([z.looseObject({}), z.array(z.unknown()), z.null()]);

export const isInputString = (value: RawInput): value is string => stringInput.safeParse(value).success;

export const isInputNumber = (value: RawInput): value is number => numberInput.safeParse(value).success;

export const isInputBoolean = (value: RawInput): value is boolean => booleanInput.safeParse(value).success;

export const isInputObject = (value: RawInput): value is object | null => objectInput.safeParse(value).success;

export const isInputCallable = (value: RawInput): value is (...args: never[]) => RawJsonInput =>
  functionInput.safeParse(value).success;
