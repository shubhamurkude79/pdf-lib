import { PDFOperator, PDFWidgetAnnotation } from 'src/core';
import PDFFont from 'src/api/PDFFont';
import PDFButton from 'src/api/form/PDFButton';
import PDFCheckBox from 'src/api/form/PDFCheckBox';
import PDFDropdown from 'src/api/form/PDFDropdown';
import PDFField from 'src/api/form/PDFField';
import PDFOptionList from 'src/api/form/PDFOptionList';
import PDFRadioGroup from 'src/api/form/PDFRadioGroup';
import PDFSignature from 'src/api/form/PDFSignature';
import PDFTextField from 'src/api/form/PDFTextField';
import {
  drawCheckBox,
  rotateInPlace,
  drawRadioButton,
  drawButton,
  drawTextField,
} from 'src/api/operations';
import { rgb, grayscale, cmyk } from 'src/api/colors';
import { reduceRotation, adjustDimsForRotation } from '../rotations';
import {
  layoutMultilineText,
  layoutCombedText,
  TextPosition,
  layoutSinglelineText,
} from '../text/layout';

/*********************** Appearance Provider Types ****************************/

type CheckBoxAppearanceProvider = (
  checkBox: PDFCheckBox,
  widget: PDFWidgetAnnotation,
) => AppearanceOrMapping<{
  checked: PDFOperator[];
  unchecked: PDFOperator[];
}>;

type RadioGroupAppearanceProvider = (
  radioGroup: PDFRadioGroup,
  widget: PDFWidgetAnnotation,
) => AppearanceOrMapping<{
  selected: PDFOperator[];
  unselected: PDFOperator[];
}>;

type ButtonAppearanceProvider = (
  button: PDFButton,
  widget: PDFWidgetAnnotation,
  font: PDFFont,
) => AppearanceOrMapping<PDFOperator[]>;

type DropdownAppearanceProvider = (
  dropdown: PDFDropdown,
  widget: PDFWidgetAnnotation,
  font: PDFFont,
) => AppearanceOrMapping<PDFOperator[]>;

type OptionListAppearanceProvider = (
  optionList: PDFOptionList,
  widget: PDFWidgetAnnotation,
  font: PDFFont,
) => AppearanceOrMapping<PDFOperator[]>;

type TextFieldAppearanceProvider = (
  textField: PDFTextField,
  widget: PDFWidgetAnnotation,
  font: PDFFont,
) => AppearanceOrMapping<PDFOperator[]>;

type SignatureAppearanceProvider = (
  signature: PDFSignature,
  widget: PDFWidgetAnnotation,
  font: PDFFont,
) => AppearanceOrMapping<PDFOperator[]>;

/******************* Appearance Provider Utility Types ************************/

type AppearanceMapping<T> = { normal: T; rollover?: T; down?: T };

type AppearanceOrMapping<T> = T | AppearanceMapping<T>;

// prettier-ignore
export type AppearanceProviderFor<T extends PDFField> = 
  T extends PDFCheckBox   ? CheckBoxAppearanceProvider
: T extends PDFRadioGroup ? RadioGroupAppearanceProvider
: T extends PDFButton     ? ButtonAppearanceProvider
: T extends PDFDropdown   ? DropdownAppearanceProvider
: T extends PDFOptionList ? OptionListAppearanceProvider
: T extends PDFTextField  ? TextFieldAppearanceProvider
: T extends PDFSignature  ? SignatureAppearanceProvider
: never;

/********************* Appearance Provider Functions **************************/

export const normalizeAppearance = <T>(
  appearance: T | AppearanceMapping<T>,
): AppearanceMapping<T> => {
  if ('normal' in appearance) return appearance;
  return { normal: appearance };
};

// prettier-ignore
const componentsToColor = (comps?: number[], scale = 1) => (
    comps?.length === 1 ? grayscale(
      comps[0] * scale,
    )
  : comps?.length === 3 ? rgb(
      comps[0] * scale, 
      comps[1] * scale, 
      comps[2] * scale,
    )
  : comps?.length === 4 ? cmyk(
      comps[0] * scale, 
      comps[1] * scale, 
      comps[2] * scale, 
      comps[3] * scale,
    )
  : undefined
);

export const defaultCheckBoxAppearanceProvider: AppearanceProviderFor<PDFCheckBox> = (
  _checkBox,
  widget,
) => {
  const rectangle = widget.getRectangle();
  const ap = widget.getAppearanceCharacteristics();
  const bs = widget.getBorderStyle();

  const borderWidth = bs?.getWidth() ?? 1;
  const rotation = reduceRotation(ap?.getRotation());
  const { width, height } = adjustDimsForRotation(rectangle, rotation);

  const rotate = rotateInPlace({ ...rectangle, rotation });

  // const black = rgb(0, 0, 0);
  const borderColor = componentsToColor(ap?.getBorderColor());
  const normalBackgroundColor = componentsToColor(ap?.getBackgroundColor());
  const downBackgroundColor = componentsToColor(ap?.getBackgroundColor(), 0.8);

  const options = {
    x: 0,
    y: 0,
    width,
    height,
    thickness: 1.5,
    borderWidth,
    borderColor,
  };

  return {
    normal: {
      checked: [
        ...rotate,
        ...drawCheckBox({
          ...options,
          color: normalBackgroundColor,
          markColor: borderColor,
          filled: true,
        }),
      ],
      unchecked: [
        ...rotate,
        ...drawCheckBox({
          ...options,
          color: normalBackgroundColor,
          markColor: borderColor,
          filled: false,
        }),
      ],
    },
    down: {
      checked: [
        ...rotate,
        ...drawCheckBox({
          ...options,
          color: downBackgroundColor,
          markColor: borderColor,
          filled: true,
        }),
      ],
      unchecked: [
        ...rotate,
        ...drawCheckBox({
          ...options,
          color: downBackgroundColor,
          markColor: borderColor,
          filled: false,
        }),
      ],
    },
  };
};

export const defaultRadioGroupAppearanceProvider: AppearanceProviderFor<PDFRadioGroup> = (
  _radioGroup,
  widget,
) => {
  const rectangle = widget.getRectangle();
  const ap = widget.getAppearanceCharacteristics();
  const bs = widget.getBorderStyle();

  const borderWidth = bs?.getWidth();
  const rotation = reduceRotation(ap?.getRotation());
  const { width, height } = adjustDimsForRotation(rectangle, rotation);

  const rotate = rotateInPlace({ ...rectangle, rotation });

  // const black = rgb(0, 0, 0);
  const borderColor = componentsToColor(ap?.getBorderColor());
  const normalBackgroundColor = componentsToColor(ap?.getBackgroundColor());
  const downBackgroundColor = componentsToColor(ap?.getBackgroundColor(), 0.8);

  const options = {
    x: width / 2,
    y: height / 2,
    width,
    height,
    borderWidth: borderWidth ?? 0,
    borderColor,
  };

  return {
    normal: {
      selected: [
        ...rotate,
        ...drawRadioButton({
          ...options,
          color: normalBackgroundColor,
          dotColor: borderColor,
          filled: true,
        }),
      ],
      unselected: [
        ...rotate,
        ...drawRadioButton({
          ...options,
          color: normalBackgroundColor,
          dotColor: borderColor,
          filled: false,
        }),
      ],
    },
    down: {
      selected: [
        ...rotate,
        ...drawRadioButton({
          ...options,
          color: downBackgroundColor,
          dotColor: borderColor,
          filled: true,
        }),
      ],
      unselected: [
        ...rotate,
        ...drawRadioButton({
          ...options,
          color: downBackgroundColor,
          dotColor: borderColor,
          filled: false,
        }),
      ],
    },
  };
};

// TODO: This should use `layoutSinglelineText`
export const defaultButtonAppearanceProvider: AppearanceProviderFor<PDFButton> = (
  _radioGroup,
  widget,
  font,
) => {
  const rectangle = widget.getRectangle();
  const ap = widget.getAppearanceCharacteristics();
  const bs = widget.getBorderStyle();
  const captions = ap?.getCaptions();
  const normalText = captions?.normal ?? '';
  const downText = captions?.down ?? normalText ?? '';

  const borderWidth = bs?.getWidth();
  const rotation = reduceRotation(ap?.getRotation());
  const { width, height } = adjustDimsForRotation(rectangle, rotation);

  const rotate = rotateInPlace({ ...rectangle, rotation });

  const black = rgb(0, 0, 0);

  // TODO: Probably shouldn't default this so it can be transparent (e.g. check box and radio group)
  const borderColor = componentsToColor(ap?.getBorderColor());
  const normalBackgroundColor = componentsToColor(ap?.getBackgroundColor());
  const downBackgroundColor = componentsToColor(ap?.getBackgroundColor(), 0.8);

  const fontSize = 15;

  const options = {
    x: 0,
    y: 0,
    width,
    height,
    borderWidth: borderWidth ?? 0,
    borderColor,
    textColor: borderColor ?? black,
    font: font.name,
    fontSize,
    encodeText: (t: string) => font.encodeText(t),
    widthOfText: (t: string) => font.widthOfTextAtSize(t, fontSize),
    heightOfText: (_t: string) => font.heightAtSize(fontSize),
  };

  return {
    normal: [
      ...rotate,
      ...drawButton({
        ...options,
        color: normalBackgroundColor,
        text: normalText,
      }),
    ],
    down: [
      ...rotate,
      ...drawButton({
        ...options,
        color: downBackgroundColor,
        text: downText,
      }),
    ],
  };
};

// Examples:
//   `/Helv 12 Tf` -> ['Helv', '12']
//   `/HeBo 8.00 Tf` -> ['HeBo', '8.00']
const tfRegex = /\/([^\0\t\n\f\r\ ]+)[\0\t\n\f\r\ ]+(\d*\.\d+|\d+)[\0\t\n\f\r\ ]+Tf/;

// TODO: Support auto-wrapping
export const defaultTextFieldAppearanceProvider: AppearanceProviderFor<PDFTextField> = (
  textField,
  widget,
  font,
) => {
  const da = textField.acroField.getDefaultAppearance() ?? '';
  const daMatch = da.match(tfRegex) ?? [];
  const defaultFontSize = isFinite(Number(daMatch[2]))
    ? Number(daMatch[2])
    : undefined;

  const rectangle = widget.getRectangle();
  const ap = widget.getAppearanceCharacteristics();
  const bs = widget.getBorderStyle();
  const text = textField.getText() ?? '';

  const borderWidth = bs?.getWidth();
  const rotation = reduceRotation(ap?.getRotation());
  const { width, height } = adjustDimsForRotation(rectangle, rotation);

  const rotate = rotateInPlace({ ...rectangle, rotation });

  const black = rgb(0, 0, 0);

  // TODO: Probably shouldn't default this so it can be transparent (e.g. check box and radio group)
  const borderColor = componentsToColor(ap?.getBorderColor());
  const normalBackgroundColor = componentsToColor(ap?.getBackgroundColor());

  let textLines: TextPosition[];
  let fontSize: number;

  if (textField.isMultiline()) {
    const layout = layoutMultilineText(text, {
      alignment: textField.getAlignment(),
      fontSize: defaultFontSize,
      font,
      bounds: { x: 0, y: 0, width, height },
    });
    textLines = layout.lines;
    fontSize = layout.fontSize;
  } else if (textField.isEvenlySpaced()) {
    const layout = layoutCombedText(text, {
      fontSize: defaultFontSize,
      font,
      bounds: { x: 0, y: 0, width, height },
      cellCount: textField.getMaxLength() ?? 0,
    });
    textLines = layout.cells;
    fontSize = layout.fontSize;
  } else {
    const layout = layoutSinglelineText(text, {
      alignment: textField.getAlignment(),
      fontSize: defaultFontSize,
      font,
      bounds: { x: 0, y: 0, width, height },
    });
    textLines = [layout.line];
    fontSize = layout.fontSize;
  }

  const options = {
    x: 0,
    y: 0,
    width,
    height,
    borderWidth: borderWidth ?? 0,
    borderColor,
    textColor: borderColor ?? black,
    font: font.name,
    fontSize,
    color: normalBackgroundColor,
    textLines,
  };

  return [...rotate, ...drawTextField(options)];
};
