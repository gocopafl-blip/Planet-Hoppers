// scripts/core/lender_catalogue.js
// Third-party lenders for the Aegis loan market (Phase 3.2c).
// Rates/splits tune here — banking_manager applies them; UI only displays catalogue data.

const LENDER_CATALOGUE = [
    {
        id: 'kestrel_micro',
        name: 'Kestrel Microcredit',
        tagline: 'Small draws for contractors with thin files.',
        logoKey: 'lender_kestrel_micro',
        brandColor: '#3dff8a',
        channelLabel: 'Dock Terminal Kiosks',
        ribbon: 'lowest_fee',
        minCreditScore: 380,
        products: [
            {
                id: 'pocket_300',
                name: 'Pocket Float',
                principal: 300,
                headlineRatePct: 12,
                interestRateOfGross: 0.09,
                principalRateOfGross: 0.03,
                originationFee: 25,
                earlyPayoffFee: 0,
                minCreditScore: 380,
                termsSummary: '12% of gross pay (9% interest · 3% principal)',
                finePrint: 'No early payoff fee. Origination ¢25 withheld at draw.'
            }
        ]
    },
    {
        id: 'rust_belt',
        name: 'Rust Belt Lending Co.',
        tagline: 'Bridge cash until the next contract lands.',
        logoKey: 'lender_rust_belt',
        brandColor: '#e8924a',
        channelLabel: 'In-Station & Relay Net',
        ribbon: 'great_value',
        minCreditScore: 480,
        products: [
            {
                id: 'bridge_500',
                name: 'Bridge Loan',
                principal: 500,
                headlineRatePct: 14,
                interestRateOfGross: 0.11,
                principalRateOfGross: 0.03,
                originationFee: 50,
                earlyPayoffFee: 100,
                perJobFee: 0,
                minCreditScore: 480,
                termsSummary: '14% of gross pay (11% interest · 3% principal)',
                finePrint: '¢100 early payoff fee. Origination ¢50 at draw.'
            }
        ]
    },
    {
        id: 'dockside_hustle',
        name: 'Dockside Hustle Loans',
        tagline: 'Friendly rates* — *friendship sold separately.',
        logoKey: 'lender_dockside_hustle',
        brandColor: '#c8e632',
        channelLabel: 'Dockside Booths',
        ribbon: null,
        minCreditScore: 440,
        products: [
            {
                id: 'hustle_750',
                name: 'Quick Turn',
                principal: 750,
                headlineRatePct: 14,
                interestRateOfGross: 0.12,
                principalRateOfGross: 0.02,
                originationFee: 75,
                earlyPayoffFee: 150,
                perJobFee: 0,
                compoundAfterMissions: 5,
                compoundPrincipalPct: 0.04,
                minCreditScore: 440,
                termsSummary: '14% of gross pay (12% interest · 2% principal)',
                finePrint: 'Advertised 14% — slow principal paydown. ¢150 early payoff fee. Principal compounds +4% every 5 jobs without principal pay.'
            }
        ]
    },
    {
        id: 'parallax_pawn',
        name: 'Parallax Pawn & Lend',
        tagline: 'We remember every favor. And every default.',
        logoKey: 'lender_parallax_pawn',
        brandColor: '#b48cff',
        channelLabel: 'Collateral Desk',
        ribbon: null,
        minCreditScore: 500,
        products: [
            {
                id: 'pawn_1000',
                name: 'Cargo Pledge',
                principal: 1000,
                headlineRatePct: 16,
                interestRateOfGross: 0.10,
                principalRateOfGross: 0.06,
                originationFee: 80,
                earlyPayoffFee: 200,
                collateralRequired: true,
                minCreditScore: 500,
                termsSummary: '16% of gross pay (10% interest · 6% principal)',
                finePrint: 'Faster principal burn, stiff ¢200 early payoff fee. Active ship pledged as collateral.'
            }
        ]
    },
    {
        id: 'orbital_factors',
        name: 'Orbital Factors Union',
        tagline: 'Respectable paper for established haulers.',
        logoKey: 'lender_orbital_factors',
        brandColor: '#4db8ff',
        channelLabel: 'Union Direct Deposit',
        ribbon: null,
        minCreditScore: 560,
        products: [
            {
                id: 'factors_1200',
                name: 'Receivables Advance',
                principal: 1200,
                headlineRatePct: 13,
                interestRateOfGross: 0.08,
                principalRateOfGross: 0.05,
                originationFee: 60,
                earlyPayoffFee: 75,
                minCreditScore: 560,
                termsSummary: '13% of gross pay (8% interest · 5% principal)',
                finePrint: 'Union-standard terms. ¢75 early payoff fee.'
            }
        ]
    },
    {
        id: 'voidway',
        name: 'Voidway Finance',
        tagline: 'Gap coverage for when the rim eats your margin.',
        logoKey: 'lender_voidway',
        brandColor: '#ff5c6a',
        channelLabel: 'Rim Relay — 24/7',
        ribbon: 'fast_funding',
        minCreditScore: 520,
        products: [
            {
                id: 'gap_1500',
                name: 'Rim Gap Loan',
                principal: 1500,
                headlineRatePct: 17,
                interestRateOfGross: 0.13,
                principalRateOfGross: 0.04,
                originationFee: 100,
                earlyPayoffFee: 125,
                perJobFee: 100,
                minCreditScore: 520,
                termsSummary: '17% of gross pay (13% interest · 4% principal)',
                finePrint: 'Sized for fuel-heavy routes. ¢100 per completed contract. Origination ¢100.'
            }
        ]
    },
    {
        id: 'nova_spindle',
        name: 'Nova Spindle Capital',
        tagline: 'Premium credit for operators who look good on paper.',
        logoKey: 'lender_nova_spindle',
        brandColor: '#ffd24a',
        channelLabel: 'Private Banking Tier',
        ribbon: 'best_rate',
        minCreditScore: 640,
        products: [
            {
                id: 'premium_2000',
                name: 'Tier-2 Facility',
                principal: 2000,
                headlineRatePct: 11,
                interestRateOfGross: 0.06,
                principalRateOfGross: 0.05,
                originationFee: 90,
                earlyPayoffFee: 50,
                minCreditScore: 640,
                termsSummary: '11% of gross pay (6% interest · 5% principal)',
                finePrint: 'Best headline rate in the market — requires strong K-14 score.'
            }
        ]
    },
    {
        id: 'redshift',
        name: 'Redshift Receivables',
        tagline: 'When you need it yesterday and don\'t ask about tomorrow.',
        logoKey: 'lender_redshift',
        brandColor: '#ff3b3b',
        channelLabel: 'Emergency Wire — No Questions',
        ribbon: 'fast_funding',
        minCreditScore: 360,
        products: [
            {
                id: 'desperate_3500',
                name: 'Redline Advance',
                principal: 3500,
                headlineRatePct: 27,
                interestRateOfGross: 0.22,
                principalRateOfGross: 0.05,
                originationFee: 250,
                earlyPayoffFee: 500,
                minCreditScore: 360,
                termsSummary: '27% of gross pay (22% interest · 5% principal)',
                finePrint: 'Deep-pocket emergency draw. ¢500 early payoff fee. Read the fine print twice.'
            }
        ]
    }
];
