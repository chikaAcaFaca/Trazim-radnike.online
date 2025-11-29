import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, buttonVariants } from '@/components/ui/button';

describe('Button Component', () => {
  describe('rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);

      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('should render as button element by default', () => {
      render(<Button>Test</Button>);

      expect(screen.getByRole('button').tagName).toBe('BUTTON');
    });

    it('should accept and apply className', () => {
      render(<Button className="custom-class">Test</Button>);

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('variants', () => {
    it('should apply default variant styles', () => {
      render(<Button>Default</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });

    it('should apply destructive variant styles', () => {
      render(<Button variant="destructive">Destructive</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
    });

    it('should apply outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
    });

    it('should apply secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary');
    });

    it('should apply ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('should apply link variant styles', () => {
      render(<Button variant="link">Link</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('underline-offset-4');
    });
  });

  describe('sizes', () => {
    it('should apply default size', () => {
      render(<Button>Default Size</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });

    it('should apply sm size', () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
    });

    it('should apply lg size', () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11');
    });

    it('should apply icon size', () => {
      render(<Button size="icon">Icon</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should apply disabled styles', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
    });
  });

  describe('interactions', () => {
    it('should handle click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('asChild prop', () => {
    it('should render as slot when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveTextContent('Link Button');
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  describe('button type', () => {
    it('should support type attribute', () => {
      render(<Button type="submit">Submit</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('accessibility', () => {
    it('should be focusable', () => {
      render(<Button>Focusable</Button>);

      const button = screen.getByRole('button');
      button.focus();

      expect(document.activeElement).toBe(button);
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>);

      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });
  });
});

describe('buttonVariants', () => {
  it('should return class string for default variant', () => {
    const classes = buttonVariants();

    expect(classes).toContain('bg-primary');
    expect(classes).toContain('h-10');
  });

  it('should return class string for custom variant and size', () => {
    const classes = buttonVariants({ variant: 'destructive', size: 'lg' });

    expect(classes).toContain('bg-destructive');
    expect(classes).toContain('h-11');
  });

  it('should include custom className', () => {
    const classes = buttonVariants({ className: 'custom-class' });

    expect(classes).toContain('custom-class');
  });
});
