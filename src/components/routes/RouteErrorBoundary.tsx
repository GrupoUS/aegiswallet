

function RouteErrorBoundary({ error, reset }: RouteErrorBoundaryProps) {
  const navigate = useNavigate();
  return (
    &amp;lt;div className=&quot;container mx-auto max-w-md p-6&quot;&amp;gt;
      &amp;lt;Card&amp;gt;
        &amp;lt;CardHeader&amp;gt;
          &amp;lt;