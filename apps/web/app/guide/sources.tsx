import { ExternalLink } from "lucide-react";

export const LAST_UPDATED = { iso: "2026-11-11", text: "11 November 2026" };

type Source = {
    id: string;
    title: string;
    publisher: string;
    url: string;
    note?: string;
    more?: { label: string; url: string }[];
};

const F1 = "https://www.formula1.com/en";
const FIA_DOCS = "https://www.fia.com/system/files/documents";

// Order here is the citation number shown on the page.
export const sources = [
    {
        id: "weekend",
        title: "The beginner’s guide to the F1 weekend",
        publisher: "Formula 1",
        url: `${F1}/latest/article/the-beginners-guide-to-the-formula-1-weekend.5RFZzGXNhEi9AEuMXwo987`,
    },
    {
        id: "sprint",
        title: "The beginner’s guide to the F1 Sprint",
        publisher: "Formula 1",
        url: `${F1}/latest/article/the-beginners-guide-to-the-f1-sprint.55yJBEiF7vYkZEwSV9lZJ9`,
    },
    {
        id: "whatIsF1",
        title: "What is F1?",
        publisher: "Formula 1",
        url: `${F1}/page/what-is-f1`,
    },
    {
        id: "overview",
        title: "Drivers, teams, cars, circuits and more: everything you need to know about F1",
        publisher: "Formula 1",
        url: `${F1}/latest/article/drivers-teams-cars-circuits-and-more-everything-you-need-to-know-about.7iQfL3Rivf1comzdqV5jwc`,
        note: "Its title and trophy counts are written “ahead of 2026”, so this guide does not reuse them.",
    },
    {
        id: "teams",
        title: "F1 teams",
        publisher: "Formula 1",
        url: `${F1}/teams`,
    },
    {
        id: "calendar",
        title: "2026 FIA Formula One World Championship race calendar",
        publisher: "Formula 1",
        url: `${F1}/racing/2026`,
    },
    {
        id: "fiaA",
        title: "2026 F1 Regulations, Section A (General Provisions), Issue 03, 25 June 2026",
        publisher: "FIA",
        url: "https://api.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_a_general_provisions_-_iss_03_-_2026-06-25.pdf",
    },
    {
        id: "fiaB",
        title: "2026 F1 Regulations, Section B (Sporting), Issue 07, 25 June 2026",
        publisher: "FIA",
        url: `${FIA_DOCS}/fia_2026_f1_regulations_-_section_b_sporting_-_iss_07_-_2026-06-25.pdf`,
    },
    {
        id: "fiaH",
        title: "International Sporting Code, Appendix H (flags and signals), 2026",
        publisher: "FIA",
        url: "https://api.fia.com/system/files/documents/appendix_h_2026_published_23062026.pdf",
    },
    {
        id: "fiaL",
        title: "International Sporting Code, Appendix L, Chapter IV (driving conduct), 2026",
        publisher: "FIA",
        url: `${FIA_DOCS}/appendix_l_2026_publie_le_24_juin_2026.pdf`,
    },
    {
        id: "fiaRegs",
        title: "FIA Formula One World Championship regulations (all seasons)",
        publisher: "FIA",
        url: "https://www.fia.com/regulation/category/110",
        note: "Use this index to find the regulations for the season you are exploring.",
    },
    {
        id: "rules2026",
        title: "Everything you need to know about the new F1 rules for 2026",
        publisher: "Formula 1",
        url: `${F1}/latest/article/everything-you-need-to-know-about-the-new-f1-rules-for-2026.48bv0VTxhIlhrQXmxercXk`,
    },
    {
        id: "terms2026",
        title: "Explained: the key terms for Formula 1’s new-for-2026 rules",
        publisher: "Formula 1",
        url: `${F1}/latest/article/explained-the-new-key-terms-for-formula-1s-new-for-2026-rules.3T5BU6TC9quGcIpGzoWkY0`,
    },
    {
        id: "pu2026",
        title: "2026 regulations explained: all you need to know about F1’s new power units",
        publisher: "Formula 1",
        url: `${F1}/latest/article/2026-regulations-explained-all-you-need-to-know-about-f1s-new-power-units.14jfv7a36905uDJDdNyfQd`,
    },
    {
        id: "glossary",
        title: "F1 glossary",
        publisher: "Formula 1",
        url: `${F1}/page/f1-glossary`,
        more: [
            { label: "A–E", url: `${F1}/latest/article/f1-glossary-a-e.1MFONigMlQSbSQtpP7YCy2` },
            { label: "F–J", url: `${F1}/latest/article/f1-glossary-f-j.2g6grJVxT6dFCDpSmgoCQX` },
            { label: "K–O", url: `${F1}/latest/article/f1-glossary-k-o.6g2hrWHA2pyxbXoe8FT9Db` },
            { label: "P–T", url: `${F1}/latest/article/f1-glossary-p-t.GBhLQtpeu9b8LrK5VM0F1` },
            { label: "U–Z", url: `${F1}/latest/article/f1-glossary-u-z.5JSlDsnyvYmbK0TCjTs7KB` },
        ],
        note: "Where the glossary and the FIA regulations disagree, this guide follows the FIA text.",
    },
    {
        id: "pirelliRange",
        title: "The range of compounds for the 2026 season has been set",
        publisher: "Pirelli",
        url: "https://press.pirelli.com/the-range-of-compounds-for-the-2026-season-has-been-set/",
    },
    {
        id: "pirelliF1",
        title: "Formula 1 and Pirelli: tyres",
        publisher: "Pirelli",
        url: "https://www.pirelli.com/tyres/en-ww/motorsport/car/formula-1",
    },
    {
        id: "openf1",
        title: "OpenF1",
        publisher: "OpenF1",
        url: "https://openf1.org",
        note: "The data source behind the dashboard (see the project README).",
    },
] as const satisfies readonly Source[];

export type SourceId = (typeof sources)[number]["id"];

export function Cite({ id }: { id: SourceId | SourceId[] }) {
    const ids = Array.isArray(id) ? id : [id];
    return (
        <sup className="ml-0.5 whitespace-nowrap text-[0.7rem] font-semibold">
            {ids.map((one) => {
                const index = sources.findIndex((s) => s.id === one);
                return (
                    <a
                        key={one}
                        href={`#src-${one}`}
                        aria-label={`Source ${index + 1}: ${sources[index].title}`}
                        className="px-0.5 text-accent-soft-foreground underline-offset-2 hover:underline"
                    >
                        [{index + 1}]
                    </a>
                );
            })}
        </sup>
    );
}

export function External({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 break-words font-medium text-accent-soft-foreground underline-offset-2 hover:underline"
        >
            {children}
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="sr-only">(opens in a new tab)</span>
        </a>
    );
}

export function SourceList() {
    return (
        <ol className="space-y-3 text-sm">
            {sources.map((source, index) => (
                <li
                    key={source.id}
                    id={`src-${source.id}`}
                    className="scroll-mt-24 flex gap-3 rounded-md border bg-card p-3"
                >
                    <span className="font-mono text-xs font-bold text-accent-soft-foreground">
                        [{index + 1}]
                    </span>
                    <div className="min-w-0 space-y-1">
                        <External href={source.url}>{source.title}</External>
                        <p className="text-xs text-muted-foreground">{source.publisher}</p>
                        {"more" in source ? (
                            <p className="flex flex-wrap gap-x-3 text-xs">
                                {source.more.map((m) => (
                                    <External key={m.url} href={m.url}>
                                        {m.label}
                                    </External>
                                ))}
                            </p>
                        ) : null}
                        {"note" in source ? (
                            <p className="text-xs text-muted-foreground">{source.note}</p>
                        ) : null}
                    </div>
                </li>
            ))}
        </ol>
    );
}
