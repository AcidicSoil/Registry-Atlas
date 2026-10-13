/** Strict input guards backed by parsed schemas at script I/O boundaries. */
import { z } from 'zod';

const textSchema = z.string();

const numberSchema = z.number();

const booleanSchema = z.boolean();

const callableSchema = z.function();

const objectSchema = z.union([z.looseObject({}), z.array(z.unknown()), z.null()]);

export const isInputString = value => textSchema.safeParse(value).success;

export const isInputNumber = value => numberSchema.safeParse(value).success;

export const isInputBoolean = value => booleanSchema.safeParse(value).success;

export const isInputCallable = value => callableSchema.safeParse(value).success;

export const isInputObject = value => objectSchema.safeParse(value).success;
