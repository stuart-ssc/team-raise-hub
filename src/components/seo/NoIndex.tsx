import { Helmet } from "react-helmet-async";

/**
 * Drop-in component to prevent search engines from indexing or following
 * links on a page. Use on every authenticated / private route as a
 * defense-in-depth measure alongside robots.txt.
 */
export const NoIndex = () => (
  <Helmet>
    <meta name="robots" content="noindex, nofollow" />
    <meta name="googlebot" content="noindex, nofollow" />
  </Helmet>
);

export default NoIndex;