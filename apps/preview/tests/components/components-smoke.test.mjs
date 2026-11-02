/**
 * Smoke tests for every component in `src/components/ui`.
 *
 * Each component is rendered to static markup (render phase only, no effects) through the
 * shared harness in `tests/motion/harness`. The tests check that the component renders
 * without throwing, shows the content it was given, and applies its key state classes.
 * Overlay components (dialog, popover, menus, ...) render their trigger in the closed
 * state; their portal content is not rendered by static markup.
 *
 * Every component module is imported inside its own test, so a broken component fails only
 * its own tests. The final suite fails when a file is added to `src/components/ui` without a
 * smoke test (or an explicit entry in SKIPPED).
 *
 * Run from the repository root:
 *   node --import ./apps/preview/tests/motion/harness/register.mjs --test "apps/preview/tests/components/*.test.mjs"
 */
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { h, renderStatic, setPlatform } from '../motion/harness/render.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const UI_DIR = path.resolve(HERE, '..', '..', 'src', 'components', 'ui');

/** Components that are deliberately not smoke-tested here, with the reason. */
const SKIPPED = {
  motion: 'Animation engine, not a visual component. Covered by tests/motion.',
  primitives: 'Re-export seam for motion hosts. Covered by tests/motion.',
};

/** Components with a describe block below. Keep in sync with the describe blocks. */
const TESTED = new Set();

function component(name, body) {
  TESTED.add(name);
  describe(name, body);
}

const ui = (name) => import(`@/components/ui/${name}`);
const text = async (value) => {
  const { Text } = await ui('text');
  return h(Text, null, value);
};
const noop = () => {};

/** Render, and fail with a readable message when nothing came out. */
function render(element) {
  const result = renderStatic(element);
  assert.equal(typeof result.markup, 'string');
  assert.ok(result.markup.length > 0, 'expected the component to render markup');
  return result;
}

function assertContains(markup, ...values) {
  for (const value of values) {
    assert.ok(markup.includes(value), `expected markup to contain "${value}"\n${markup}`);
  }
}

function assertNotContains(markup, ...values) {
  for (const value of values) {
    assert.ok(!markup.includes(value), `expected markup NOT to contain "${value}"\n${markup}`);
  }
}

/** Every className that reached a host, joined, for class assertions. */
function classNames(log) {
  return log
    .map((entry) => entry.props.className)
    .filter(Boolean)
    .join(' ');
}

/** True when `classString` contains `token` as a whole class (so `hover:bg-x` is not `bg-x`). */
function hasClass(classString, token) {
  return classString.split(/\s+/).includes(token);
}

/** The className of the first host whose props match `predicate`. */
function classNameWhere(log, predicate) {
  const entry = log.find((item) => predicate(item.props));
  assert.ok(entry, 'expected a host matching the predicate to render');
  return entry.props.className ?? '';
}

/** Render on another platform, then restore web. */
function onPlatform(os, fn) {
  setPlatform(os);
  try {
    return fn();
  } finally {
    setPlatform('web');
  }
}

component('accordion', () => {
  it('renders the trigger and the open item content', async () => {
    const { Accordion, AccordionContent, AccordionItem, AccordionTrigger } = await ui('accordion');
    const { markup } = render(
      h(
        Accordion,
        { type: 'single', value: 'a', onValueChange: noop, collapsible: true },
        h(
          AccordionItem,
          { value: 'a' },
          h(AccordionTrigger, null, await text('Question')),
          h(AccordionContent, null, await text('Answer'))
        )
      )
    );
    assertContains(markup, 'Question', 'Answer', 'data-icon="ChevronDown"');
  });
});

component('alert', () => {
  it('renders the icon, title and description', async () => {
    const { Alert, AlertDescription, AlertTitle } = await ui('alert');
    const { Info } = await import('lucide-react-native');
    const { markup, log } = render(
      h(Alert, { icon: Info }, h(AlertTitle, null, 'Heads up'), h(AlertDescription, null, 'Details'))
    );
    assertContains(markup, 'Heads up', 'Details', 'data-icon="Info"');
    assert.ok(log.some((entry) => entry.props.role === 'alert'), 'expected role="alert"');
  });

  it('applies destructive text colors', async () => {
    const { Alert, AlertDescription } = await ui('alert');
    const { Info } = await import('lucide-react-native');
    const { log } = render(
      h(Alert, { icon: Info, variant: 'destructive' }, h(AlertDescription, null, 'Failed'))
    );
    assert.match(classNames(log), /text-destructive/);
  });
});

component('alert-dialog', () => {
  it('renders the trigger and keeps closed content out of the markup', async () => {
    const { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogTrigger } =
      await ui('alert-dialog');
    const { markup } = render(
      h(
        AlertDialog,
        null,
        h(AlertDialogTrigger, null, await text('Delete')),
        h(AlertDialogContent, null, h(AlertDialogTitle, null, 'Are you sure?'))
      )
    );
    assertContains(markup, 'Delete');
    assertNotContains(markup, 'Are you sure?');
  });

  it('renders the header, footer and actions inside an open root', async () => {
    const m = await ui('alert-dialog');
    const { markup } = render(
      h(
        m.AlertDialog,
        { open: true, onOpenChange: noop },
        h(
          m.AlertDialogHeader,
          null,
          h(m.AlertDialogTitle, null, 'Title'),
          h(m.AlertDialogDescription, null, 'Description')
        ),
        h(
          m.AlertDialogFooter,
          null,
          h(m.AlertDialogCancel, null, await text('Cancel')),
          h(m.AlertDialogAction, null, await text('Continue'))
        )
      )
    );
    assertContains(markup, 'Title', 'Description', 'Cancel', 'Continue');
  });
});

component('aspect-ratio', () => {
  it('renders its children', async () => {
    const { AspectRatio } = await ui('aspect-ratio');
    const { markup } = render(h(AspectRatio, { ratio: 16 / 9 }, await text('Media')));
    assertContains(markup, 'Media');
  });
});

component('avatar', () => {
  it('renders the fallback before the image has loaded', async () => {
    const { Avatar, AvatarFallback, AvatarImage } = await ui('avatar');
    const { markup } = render(
      h(
        Avatar,
        { alt: 'Jane Doe' },
        h(AvatarImage, { source: { uri: 'https://example.com/avatar.png' } }),
        h(AvatarFallback, null, await text('JD'))
      )
    );
    assertContains(markup, 'JD');
  });
});

component('badge', () => {
  it('renders its label with the default text color', async () => {
    const { Badge } = await ui('badge');
    const { markup, log } = render(h(Badge, null, await text('New')));
    assertContains(markup, 'New');
    assert.ok(hasClass(classNames(log), 'text-primary-foreground'));
  });

  it('renders every variant', async () => {
    const { Badge } = await ui('badge');
    for (const variant of ['default', 'secondary', 'destructive', 'outline']) {
      const { markup } = render(h(Badge, { variant }, await text(variant)));
      assertContains(markup, variant);
    }
  });
});

component('bottom-sheet', () => {
  it('renders the trigger and keeps closed content out of the markup', async () => {
    const { BottomSheet, BottomSheetContent, BottomSheetTitle, BottomSheetTrigger } =
      await ui('bottom-sheet');
    const { markup } = render(
      h(
        BottomSheet,
        null,
        h(BottomSheetTrigger, null, await text('Open sheet')),
        h(BottomSheetContent, null, h(BottomSheetTitle, null, 'Sheet title'))
      )
    );
    assertContains(markup, 'Open sheet');
    assertNotContains(markup, 'Sheet title');
  });

  it('renders the header and footer inside an open root', async () => {
    const m = await ui('bottom-sheet');
    const { markup } = render(
      h(
        m.BottomSheet,
        { open: true, onOpenChange: noop },
        h(
          m.BottomSheetHeader,
          null,
          h(m.BottomSheetTitle, null, 'Title'),
          h(m.BottomSheetDescription, null, 'Description')
        ),
        h(m.BottomSheetFooter, null, await text('Footer'))
      )
    );
    assertContains(markup, 'Title', 'Description', 'Footer');
  });
});

component('breadcrumb', () => {
  it('renders links, separators, ellipsis and the current page', async () => {
    const m = await ui('breadcrumb');
    const { markup } = render(
      h(
        m.Breadcrumb,
        null,
        h(
          m.BreadcrumbList,
          null,
          h(m.BreadcrumbItem, null, h(m.BreadcrumbLink, null, await text('Home'))),
          h(m.BreadcrumbSeparator),
          h(m.BreadcrumbItem, null, h(m.BreadcrumbEllipsis)),
          h(m.BreadcrumbSeparator),
          h(m.BreadcrumbItem, null, h(m.BreadcrumbPage, null, 'Current'))
        )
      )
    );
    assertContains(markup, 'Home', 'Current', 'data-icon="ChevronRight"', 'data-icon="MoreHorizontal"');
  });
});

component('button', () => {
  it('renders its label with the default text color', async () => {
    const { Button } = await ui('button');
    const { markup, log } = render(h(Button, null, await text('Save')));
    assertContains(markup, 'Save');
    assert.match(classNames(log), /text-primary-foreground/);
    assert.match(classNames(log), /bg-primary/);
  });

  it('renders every variant and size', async () => {
    const { Button } = await ui('button');
    for (const variant of ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']) {
      for (const size of ['default', 'sm', 'lg', 'icon']) {
        const { markup } = render(h(Button, { variant, size }, await text(`${variant}-${size}`)));
        assertContains(markup, `${variant}-${size}`);
      }
    }
  });
});

component('calendar', () => {
  it('renders the selected month, year and a 6-week day grid', async () => {
    const { Calendar } = await ui('calendar');
    const value = new Date(2024, 0, 15);
    const { markup, log } = render(h(Calendar, { value, locale: 'en-US', onChange: noop }));
    assertContains(markup, 'January', '2024');

    // Day buttons are labelled like "Monday, January 15, 2024"; the month arrows are
    // labelled "Show December 2023" and have no comma.
    const dayButtons = log.filter(
      (entry) =>
        entry.props.accessibilityRole === 'button' &&
        /^\w+, /.test(entry.props.accessibilityLabel ?? '')
    );
    assert.equal(dayButtons.length, 42, 'expected 6 weeks x 7 days');
    const selected = dayButtons.filter((entry) => entry.props.accessibilityState?.selected === true);
    assert.equal(selected.length, 1, 'expected exactly one selected day');
  });
});

component('card', () => {
  it('renders all sections', async () => {
    const m = await ui('card');
    const { markup, log } = render(
      h(
        m.Card,
        null,
        h(m.CardHeader, null, h(m.CardTitle, null, 'Title'), h(m.CardDescription, null, 'Description')),
        h(m.CardContent, null, await text('Body')),
        h(m.CardFooter, null, await text('Footer'))
      )
    );
    assertContains(markup, 'Title', 'Description', 'Body', 'Footer');
    assert.ok(log.some((entry) => entry.props.role === 'heading'), 'expected the title to be a heading');
  });
});

component('carousel', () => {
  it('renders every slide and disables navigation before layout', async () => {
    const { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } =
      await ui('carousel');
    const { Text } = await ui('text');
    const { markup, log } = render(
      h(
        Carousel,
        null,
        h(CarouselContent, {
          data: ['Slide one', 'Slide two'],
          renderItem: ({ item }) => h(CarouselItem, null, h(Text, null, item)),
        }),
        h(CarouselPrevious),
        h(CarouselNext)
      )
    );
    assertContains(markup, 'Slide one', 'Slide two');
    for (const label of ['Previous slide', 'Next slide']) {
      const button = log.find((entry) => entry.props.accessibilityLabel === label);
      assert.ok(button, `expected the "${label}" button`);
      assert.equal(button.props.disabled, true);
    }
  });

  it('throws a clear error outside <Carousel>', async () => {
    const { CarouselItem } = await ui('carousel');
    assert.throws(() => renderStatic(h(CarouselItem)), /useCarousel must be used within/);
  });
});

component('checkbox', () => {
  it('shows the check icon only when checked', async () => {
    const { Checkbox } = await ui('checkbox');
    const checked = render(h(Checkbox, { checked: true, onCheckedChange: noop }));
    assertContains(checked.markup, 'data-icon="Check"');
    assert.match(classNames(checked.log), /border-primary/);

    const unchecked = render(h(Checkbox, { checked: false, onCheckedChange: noop }));
    assertNotContains(unchecked.markup, 'data-icon="Check"');
  });
});

component('collapsible', () => {
  it('shows content only when open', async () => {
    const { Collapsible, CollapsibleContent, CollapsibleTrigger } = await ui('collapsible');
    const tree = async (open) =>
      h(
        Collapsible,
        { open, onOpenChange: noop },
        h(CollapsibleTrigger, null, await text('Toggle')),
        h(CollapsibleContent, null, await text('Hidden content'))
      );
    const open = render(await tree(true));
    assertContains(open.markup, 'Toggle', 'Hidden content');
    const closed = render(await tree(false));
    assertContains(closed.markup, 'Toggle');
    assertNotContains(closed.markup, 'Hidden content');
  });
});

component('context-menu', () => {
  it('renders the trigger and keeps closed content out of the markup', async () => {
    const m = await ui('context-menu');
    const { markup } = render(
      h(
        m.ContextMenu,
        null,
        h(m.ContextMenuTrigger, null, await text('Long press me')),
        h(m.ContextMenuContent, null, h(m.ContextMenuItem, null, await text('Copy')))
      )
    );
    assertContains(markup, 'Long press me');
    assertNotContains(markup, 'Copy');
  });

  it('renders the shortcut label', async () => {
    const { ContextMenuShortcut } = await ui('context-menu');
    assertContains(render(h(ContextMenuShortcut, null, 'Ctrl+C')).markup, 'Ctrl+C');
  });
});

component('dialog', () => {
  it('renders the trigger and keeps closed content out of the markup', async () => {
    const { Dialog, DialogContent, DialogTitle, DialogTrigger } = await ui('dialog');
    const { markup } = render(
      h(
        Dialog,
        null,
        h(DialogTrigger, null, await text('Open dialog')),
        h(DialogContent, null, h(DialogTitle, null, 'Dialog title'))
      )
    );
    assertContains(markup, 'Open dialog');
    assertNotContains(markup, 'Dialog title');
  });

  it('renders the header and footer inside an open root', async () => {
    const m = await ui('dialog');
    const { markup } = render(
      h(
        m.Dialog,
        { open: true, onOpenChange: noop },
        h(m.DialogHeader, null, h(m.DialogTitle, null, 'Title'), h(m.DialogDescription, null, 'Description')),
        h(m.DialogFooter, null, await text('Footer'))
      )
    );
    assertContains(markup, 'Title', 'Description', 'Footer');
  });
});

component('dropdown-menu', () => {
  it('renders the trigger and keeps closed content out of the markup', async () => {
    const m = await ui('dropdown-menu');
    const { markup } = render(
      h(
        m.DropdownMenu,
        null,
        h(m.DropdownMenuTrigger, null, await text('Options')),
        h(m.DropdownMenuContent, null, h(m.DropdownMenuItem, null, await text('Profile')))
      )
    );
    assertContains(markup, 'Options');
    assertNotContains(markup, 'Profile');
  });

  it('renders the shortcut label', async () => {
    const { DropdownMenuShortcut } = await ui('dropdown-menu');
    assertContains(render(h(DropdownMenuShortcut, null, 'Ctrl+P')).markup, 'Ctrl+P');
  });
});

component('hover-card', () => {
  it('renders the trigger and keeps closed content out of the markup', async () => {
    const { HoverCard, HoverCardContent, HoverCardTrigger } = await ui('hover-card');
    const { markup } = render(
      h(
        HoverCard,
        null,
        h(HoverCardTrigger, null, await text('@lovdacn')),
        h(HoverCardContent, null, await text('Profile card'))
      )
    );
    assertContains(markup, '@lovdacn');
    assertNotContains(markup, 'Profile card');
  });
});

component('icon', () => {
  it('renders the given Lucide icon', async () => {
    const { Icon } = await ui('icon');
    const { ArrowRight } = await import('lucide-react-native');
    assertContains(render(h(Icon, { as: ArrowRight })).markup, 'data-icon="ArrowRight"');
  });

  it('wraps the icon in an animated host only when motion is requested', async () => {
    const { Icon } = await ui('icon');
    const { ArrowRight } = await import('lucide-react-native');
    assert.equal(render(h(Icon, { as: ArrowRight })).log.length, 0);
    const animated = render(h(Icon, { as: ArrowRight, animate: { to: { opacity: 1 } } }));
    assert.ok(animated.log.length > 0, 'expected a motion host around the icon');
    assertContains(animated.markup, 'data-icon="ArrowRight"');
  });
});

component('input', () => {
  it('passes props to the text input and dims it when not editable', async () => {
    const { Input } = await ui('input');
    const { log } = render(h(Input, { placeholder: 'Email' }));
    const input = log.find((entry) => entry.props.placeholder === 'Email');
    assert.ok(input, 'expected the placeholder to reach the input host');
    assert.doesNotMatch(input.props.className, /opacity-50/);

    const disabled = render(h(Input, { placeholder: 'Email', editable: false }));
    assert.match(classNameWhere(disabled.log, (props) => props.placeholder === 'Email'), /opacity-50/);
  });
});

component('input-otp', () => {
  it('renders one slot per index and fills typed characters', async () => {
    const { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } = await ui('input-otp');
    const { markup } = render(
      h(
        InputOTP,
        { value: '12', onChangeText: noop, maxLength: 4 },
        h(InputOTPGroup, null, h(InputOTPSlot, { index: 0 }), h(InputOTPSlot, { index: 1 })),
        h(InputOTPSeparator),
        h(InputOTPGroup, null, h(InputOTPSlot, { index: 2 }), h(InputOTPSlot, { index: 3 }))
      )
    );
    assertContains(markup, '>1<', '>2<');
  });

  it('throws a clear error when a slot is used outside <InputOTP>', async () => {
    const { InputOTPSlot } = await ui('input-otp');
    assert.throws(() => renderStatic(h(InputOTPSlot, { index: 0 })), /must be used within <InputOTP>/);
  });
});

component('label', () => {
  it('renders its text', async () => {
    const { Label } = await ui('label');
    assertContains(render(h(Label, null, 'Email address')).markup, 'Email address');
  });
});

component('menubar', () => {
  it('renders menu triggers and keeps closed content out of the markup', async () => {
    const m = await ui('menubar');
    const { markup } = render(
      h(
        m.Menubar,
        null,
        h(
          m.MenubarMenu,
          { value: 'file' },
          h(m.MenubarTrigger, null, await text('File')),
          h(m.MenubarContent, null, h(m.MenubarItem, null, await text('New tab')))
        )
      )
    );
    assertContains(markup, 'File');
    assertNotContains(markup, 'New tab');
  });

  it('renders the shortcut label', async () => {
    const { MenubarShortcut } = await ui('menubar');
    assertContains(render(h(MenubarShortcut, null, 'Ctrl+T')).markup, 'Ctrl+T');
  });
});

component('native-only-animated-view', () => {
  it('renders only its children on web', async () => {
    const { NativeOnlyAnimatedView } = await ui('native-only-animated-view');
    const { markup, log } = render(h(NativeOnlyAnimatedView, null, h('span', null, 'Child')));
    assert.equal(markup, '<span>Child</span>');
    assert.equal(log.length, 0);
  });

  it('wraps its children in an animated view on native', async () => {
    const { NativeOnlyAnimatedView } = await ui('native-only-animated-view');
    const { markup, log } = onPlatform('ios', () =>
      render(h(NativeOnlyAnimatedView, null, h('span', null, 'Child')))
    );
    assertContains(markup, 'Child');
    assert.ok(log.some((entry) => entry.animated), 'expected an animated host on native');
  });
});

component('popover', () => {
  it('renders the trigger and keeps closed content out of the markup', async () => {
    const { Popover, PopoverContent, PopoverTrigger } = await ui('popover');
    const { markup } = render(
      h(
        Popover,
        null,
        h(PopoverTrigger, null, await text('Open popover')),
        h(PopoverContent, null, await text('Popover body'))
      )
    );
    assertContains(markup, 'Open popover');
    assertNotContains(markup, 'Popover body');
  });
});

component('progress', () => {
  it('positions the web indicator from the value', async () => {
    const { Progress } = await ui('progress');
    const { log } = render(h(Progress, { value: 25 }));
    assert.ok(
      log.some((entry) => entry.style.transform === 'translateX(-75%)'),
      'expected the indicator to be translated by the remaining 75%'
    );
  });

  it('clamps values outside 0-100', async () => {
    const { Progress } = await ui('progress');
    assert.ok(render(h(Progress, { value: 150 })).log.some((e) => e.style.transform === 'translateX(-0%)'));
    assert.ok(render(h(Progress, { value: -20 })).log.some((e) => e.style.transform === 'translateX(-100%)'));
  });
});

component('radio-group', () => {
  it('shows the indicator only on the selected item', async () => {
    const { RadioGroup, RadioGroupItem } = await ui('radio-group');
    const { log } = render(
      h(
        RadioGroup,
        { value: 'a', onValueChange: noop },
        h(RadioGroupItem, { value: 'a' }),
        h(RadioGroupItem, { value: 'b' })
      )
    );
    const indicators = log.filter((entry) => entry.props.className?.includes('size-2 rounded-full'));
    assert.equal(indicators.length, 1, 'expected one selected indicator');
  });
});

component('select', () => {
  it('shows the placeholder when nothing is selected', async () => {
    const { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } = await ui('select');
    const { markup } = render(
      h(
        Select,
        null,
        h(SelectTrigger, null, h(SelectValue, { placeholder: 'Pick a fruit' })),
        h(SelectContent, null, h(SelectItem, { value: 'apple', label: 'Apple' }))
      )
    );
    assertContains(markup, 'Pick a fruit', 'data-icon="ChevronDown"');
  });

  it('shows the selected option label', async () => {
    const { Select, SelectTrigger, SelectValue } = await ui('select');
    const { markup } = render(
      h(
        Select,
        { value: { value: 'apple', label: 'Apple' }, onValueChange: noop },
        h(SelectTrigger, null, h(SelectValue, { placeholder: 'Pick a fruit' }))
      )
    );
    assertContains(markup, 'Apple');
    assertNotContains(markup, 'Pick a fruit');
  });
});

component('separator', () => {
  it('uses the orientation to size the line', async () => {
    const { Separator } = await ui('separator');
    assert.match(classNames(render(h(Separator)).log), /h-\[1px\] w-full/);
    assert.match(classNames(render(h(Separator, { orientation: 'vertical' })).log), /h-full w-\[1px\]/);
  });
});

component('sheet', () => {
  it('renders the trigger and keeps closed content out of the markup', async () => {
    const { Sheet, SheetContent, SheetTitle, SheetTrigger } = await ui('sheet');
    const { markup } = render(
      h(
        Sheet,
        null,
        h(SheetTrigger, null, await text('Open sheet')),
        h(SheetContent, { side: 'left' }, h(SheetTitle, null, 'Sheet title'))
      )
    );
    assertContains(markup, 'Open sheet');
    assertNotContains(markup, 'Sheet title');
  });

  it('renders the header and footer inside an open root', async () => {
    const m = await ui('sheet');
    const { markup } = render(
      h(
        m.Sheet,
        { open: true, onOpenChange: noop },
        h(m.SheetHeader, null, h(m.SheetTitle, null, 'Title'), h(m.SheetDescription, null, 'Description')),
        h(m.SheetFooter, null, await text('Footer'))
      )
    );
    assertContains(markup, 'Title', 'Description', 'Footer');
  });
});

component('sidebar', () => {
  async function tree(providerProps, sidebarProps = {}) {
    const m = await ui('sidebar');
    const { Text } = await ui('text');
    return h(
      m.SidebarProvider,
      providerProps,
      h(
        m.Sidebar,
        sidebarProps,
        h(m.SidebarHeader, null, h(Text, null, 'Workspace')),
        h(
          m.SidebarContent,
          null,
          h(
            m.SidebarGroup,
            null,
            h(m.SidebarGroupLabel, null, 'Group label'),
            h(
              m.SidebarMenu,
              null,
              h(
                m.SidebarMenuItem,
                null,
                h(m.SidebarMenuButton, { isActive: true }, h(Text, null, 'Inbox'))
              )
            )
          )
        ),
        h(m.SidebarFooter, null, h(Text, null, 'Footer'))
      ),
      h(m.SidebarInset, null, h(m.SidebarTrigger))
    );
  }

  it('renders an expanded desktop sidebar', async () => {
    const { markup, log } = render(await tree({ defaultOpen: true }));
    assertContains(markup, 'Workspace', 'Group label', 'Inbox', 'Footer', 'data-icon="PanelLeft"');
    assert.ok(hasClass(classNames(log), 'bg-sidebar-accent'), 'expected the active item highlight');
  });

  it('hides labels on the collapsed icon rail', async () => {
    const { markup } = render(await tree({ open: false, onOpenChange: noop }, { collapsible: 'icon' }));
    assertNotContains(markup, 'Group label', 'Inbox');
  });

  it('renders as a drawer on narrow screens', async () => {
    globalThis.__TEST_WINDOW_WIDTH__ = 375;
    try {
      const { markup, log } = render(await tree({ defaultOpen: true }));
      assertContains(markup, 'Inbox');
      assert.ok(log.some((entry) => entry.props.accessibilityLabel === 'Close sidebar'));
    } finally {
      delete globalThis.__TEST_WINDOW_WIDTH__;
    }
  });

  it('throws a clear error outside <SidebarProvider>', async () => {
    const { SidebarTrigger } = await ui('sidebar');
    assert.throws(() => renderStatic(h(SidebarTrigger)), /useSidebar must be used within a SidebarProvider/);
  });
});

component('skeleton', () => {
  it('pulses with CSS by default', async () => {
    const { Skeleton } = await ui('skeleton');
    assert.match(classNames(render(h(Skeleton, { className: 'h-4 w-24' })).log), /animate-pulse/);
  });
});

component('sonner', () => {
  it('provides the toast function and renders the inline viewport', async () => {
    const { ToastProvider, toast, useToast } = await ui('sonner');
    function Consumer() {
      const context = useToast();
      return h('span', null, typeof context.toast === 'function' ? 'toast-ready' : 'missing');
    }
    const { markup } = render(h(ToastProvider, { portal: false }, h(Consumer)));
    assertContains(markup, 'toast-ready');
    assert.equal(typeof toast.show, 'function');
  });

  it('throws a clear error outside <ToastProvider>', async () => {
    const { useToast } = await ui('sonner');
    function Consumer() {
      useToast();
      return null;
    }
    assert.throws(() => renderStatic(h(Consumer)), /useToast must be used within a ToastProvider/);
  });
});

component('spinner', () => {
  it('renders the animated icon by default', async () => {
    const { Spinner } = await ui('spinner');
    const { markup, log } = render(h(Spinner));
    assertContains(markup, 'data-icon="Loader2"');
    assert.ok(log.some((entry) => entry.animated), 'expected an animated host');
  });

  it('renders the platform activity indicator when nativeOnly', async () => {
    const { Spinner } = await ui('spinner');
    const { log } = render(h(Spinner, { nativeOnly: true, size: 'large' }));
    assert.ok(log.some((entry) => entry.host === 'ActivityIndicator'));
  });
});

component('switch', () => {
  it('reflects the checked state in its classes', async () => {
    const { Switch } = await ui('switch');
    const on = classNames(render(h(Switch, { checked: true, onCheckedChange: noop })).log);
    assert.match(on, /bg-primary/);
    assert.match(on, /translate-x-3\.5/);
    const off = classNames(render(h(Switch, { checked: false, onCheckedChange: noop })).log);
    assert.match(off, /bg-input/);
    assert.match(off, /translate-x-0/);
  });
});

component('tabs', () => {
  it('renders the selected panel and highlights its trigger', async () => {
    const { Tabs, TabsContent, TabsList, TabsTrigger } = await ui('tabs');
    const { markup, log } = render(
      h(
        Tabs,
        { value: 'a', onValueChange: noop },
        h(
          TabsList,
          null,
          h(TabsTrigger, { value: 'a' }, await text('Account')),
          h(TabsTrigger, { value: 'b' }, await text('Password'))
        ),
        h(TabsContent, { value: 'a' }, await text('Panel A')),
        h(TabsContent, { value: 'b' }, await text('Panel B'))
      )
    );
    assertContains(markup, 'Account', 'Password', 'Panel A');
    assertNotContains(markup, 'Panel B');
    // Triggers render in order; identify them by their own base classes.
    const triggers = log
      .map((entry) => entry.props.className ?? '')
      .filter((className) => hasClass(className, 'rounded-xl') && hasClass(className, 'border-transparent'));
    assert.equal(triggers.length, 2, 'expected two tab triggers');
    assert.ok(hasClass(triggers[0], 'bg-primary'), 'expected the selected trigger highlight');
    assert.ok(!hasClass(triggers[1], 'bg-primary'));
  });
});

component('text', () => {
  it('maps heading variants to heading roles', async () => {
    const { Text } = await ui('text');
    const { markup, log } = render(h(Text, { variant: 'h1' }, 'Page title'));
    assertContains(markup, 'Page title');
    assert.equal(log[0].props.role, 'heading');
    assert.equal(log[0].props['aria-level'], '1');
  });

  it('inherits classes from TextClassContext', async () => {
    const { Text, TextClassContext } = await ui('text');
    const { log } = render(
      h(TextClassContext.Provider, { value: 'text-destructive' }, h(Text, null, 'Inherited'))
    );
    assert.match(log[0].props.className, /text-destructive/);
  });
});

component('textarea', () => {
  it('renders a multiline input', async () => {
    const { Textarea } = await ui('textarea');
    const { log } = render(h(Textarea, { placeholder: 'Message' }));
    const input = log.find((entry) => entry.props.placeholder === 'Message');
    assert.ok(input, 'expected the placeholder to reach the input host');
    assert.equal(input.props.multiline, true);
  });
});

component('toggle', () => {
  it('reflects the pressed state', async () => {
    const { Toggle } = await ui('toggle');
    const pressed = render(h(Toggle, { pressed: true, onPressedChange: noop }, await text('Bold')));
    assertContains(pressed.markup, 'Bold');
    assert.ok(hasClass(classNames(pressed.log), 'bg-accent'));
    const released = render(h(Toggle, { pressed: false, onPressedChange: noop }, await text('Bold')));
    assert.ok(!hasClass(classNames(released.log), 'bg-accent'));
  });

  it('renders ToggleIcon', async () => {
    const { ToggleIcon } = await ui('toggle');
    const { Bold } = await import('lucide-react-native');
    assertContains(render(h(ToggleIcon, { as: Bold })).markup, 'data-icon="Bold"');
  });
});

component('toggle-group', () => {
  it('highlights the selected item', async () => {
    const { ToggleGroup, ToggleGroupItem } = await ui('toggle-group');
    const { markup, log } = render(
      h(
        ToggleGroup,
        { type: 'single', value: 'left', onValueChange: noop },
        h(ToggleGroupItem, { value: 'left', isFirst: true }, await text('Left')),
        h(ToggleGroupItem, { value: 'right', isLast: true }, await text('Right'))
      )
    );
    assertContains(markup, 'Left', 'Right');
    const first = classNameWhere(log, (props) => hasClass(props.className ?? '', 'rounded-l-md'));
    const last = classNameWhere(log, (props) => hasClass(props.className ?? '', 'rounded-r-md'));
    assert.ok(hasClass(first, 'bg-accent'), 'expected the selected item highlight');
    assert.ok(!hasClass(last, 'bg-accent'));
  });

  it('throws a clear error when an item is used outside <ToggleGroup>', async () => {
    const { ToggleGroupItem } = await ui('toggle-group');
    assert.throws(
      () => renderStatic(h(ToggleGroupItem, { value: 'x' })),
      /cannot be rendered outside the ToggleGroup component/
    );
  });
});

component('tooltip', () => {
  it('renders the trigger and keeps closed content out of the markup', async () => {
    const { Tooltip, TooltipContent, TooltipTrigger } = await ui('tooltip');
    const { markup } = render(
      h(
        Tooltip,
        null,
        h(TooltipTrigger, null, await text('Hover me')),
        h(TooltipContent, null, await text('Tooltip text'))
      )
    );
    assertContains(markup, 'Hover me');
    assertNotContains(markup, 'Tooltip text');
  });
});

describe('coverage', () => {
  it('every file in src/components/ui has a smoke test or a documented skip', () => {
    const files = readdirSync(UI_DIR)
      .filter((file) => file.endsWith('.tsx'))
      .map((file) => file.replace(/\.tsx$/, ''));
    const missing = files.filter((name) => !TESTED.has(name) && !(name in SKIPPED));
    assert.deepEqual(missing, [], `add smoke tests (or a SKIPPED entry) for: ${missing.join(', ')}`);
  });

  it('has no stale entries', () => {
    const files = new Set(
      readdirSync(UI_DIR)
        .filter((file) => file.endsWith('.tsx'))
        .map((file) => file.replace(/\.tsx$/, ''))
    );
    const stale = [...TESTED, ...Object.keys(SKIPPED)].filter((name) => !files.has(name));
    assert.deepEqual(stale, [], `remove tests for deleted components: ${stale.join(', ')}`);
  });
});
