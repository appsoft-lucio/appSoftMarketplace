function Button({
  children,
  variant = "primary",
  type = "button",
  className = "",
  onClick,
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`.trim()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;
