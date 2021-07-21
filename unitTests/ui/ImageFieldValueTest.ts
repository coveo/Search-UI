import * as Mock from '../MockEnvironment';
import { ImageFieldValue, IImageFieldValue } from '../../src/ui/FieldImage/ImageFieldValue';
import { $$ } from '../../src/Core';
import { FakeResults } from '../Fake';

export function FieldImageTest() {
  describe('ImageFieldValue', () => {
    let test: Mock.IBasicComponentSetup<ImageFieldValue>;
    const imgPath = 'img/1';
    function initializeFieldValueComponent(options: IImageFieldValue, result = FakeResults.createFakeResult()) {
      result.raw['ccimage'] = imgPath;
      test = Mock.advancedResultComponentSetup<ImageFieldValue>(ImageFieldValue, result, <Mock.AdvancedComponentSetupOptions>{
        element: $$('div').el,
        cmpOptions: options
      });
    }

    describe('exposes options', () => {
      it('field should get set by the option', () => {
        const field = '@field';
        initializeFieldValueComponent({ field });
        expect(test.cmp.options.field).toBe(field);
      });

      it('width should be applied to the img tag', () => {
        const width = 50;
        initializeFieldValueComponent({
          field: '@ccimage',
          width
        });
        const img = $$(test.cmp.element).find('img');
        expect(img.getAttribute('width')).toBe(width.toString());
      });

      it('height should be applied to the img tag', () => {
        const height = 50;
        initializeFieldValueComponent({
          field: '@ccimage',
          height
        });
        const img = $$(test.cmp.element).find('img');
        expect(img.getAttribute('height')).toBe(height.toString());
      });

      it('srcTemplate should be resolved and applied to the img tag', () => {
        initializeFieldValueComponent(
          {
            field: '@ccimage',
            srcTemplate: 'https://somewebsite.com/${raw.image}.webp'
          },
          { ...FakeResults.createFakeResult(), raw: { image: 'abc' } }
        );
        const img = $$(test.cmp.element).find('img');
        expect(img.getAttribute('src')).toBe('https://somewebsite.com/abc.webp');
      });
    });
  });
}
