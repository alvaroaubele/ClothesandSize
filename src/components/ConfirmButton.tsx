"use client";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { message: string };

/** Submit button that asks before an irreversible action. Without JavaScript it submits directly. */
export default function ConfirmButton({ message, onClick, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      onClick={(e) => {
        if (!window.confirm(message)) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}
