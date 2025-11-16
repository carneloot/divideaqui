import {
	DollarSign,
	Download,
	Lock,
	Percent,
	Receipt,
	Share2,
	Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

interface InstructionsPanelProps {
	useAccordion?: boolean;
}

const FEATURES = [
	{
		key: "createGroups",
		icon: Users,
	},
	{
		key: "addPeople",
		icon: Users,
	},
	{
		key: "paymentGroups",
		icon: Share2,
	},
	{
		key: "addExpenses",
		icon: Receipt,
	},
	{
		key: "setTips",
		icon: Percent,
	},
	{
		key: "viewSummary",
		icon: DollarSign,
	},
	{
		key: "shareSummary",
		icon: Share2,
	},
	{
		key: "generatePix",
		icon: DollarSign,
	},
	{
		key: "exportImport",
		icon: Download,
	},
] as const;

export function InstructionsPanel({
	useAccordion = false,
}: InstructionsPanelProps) {
	const { t } = useTranslation();

	const featuresContent = (
		<div className="space-y-4">
			{FEATURES.map(({ key, icon: Icon }) => (
				<div
					key={key}
					className="flex gap-4 rounded-lg border border-border bg-card p-4"
				>
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
						<Icon className="h-5 w-5" />
					</div>
					<div className="flex-1 space-y-1">
						<h4 className="font-semibold text-foreground text-sm">
							{t(`instructions.features.${key}.title`)}
						</h4>
						<p className="text-muted-foreground text-sm">
							{t(`instructions.features.${key}.description`)}
						</p>
					</div>
				</div>
			))}
		</div>
	);

	const privacySection = (
		<Card className="border-primary/20 bg-primary/5">
			<CardContent className="flex gap-4 p-6">
				<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
					<Lock className="h-6 w-6" />
				</div>
				<div className="flex-1 space-y-2">
					<h3 className="font-semibold text-foreground text-base">
						{t("instructions.privacy.title")}
					</h3>
					<p className="text-muted-foreground text-sm">
						{t("instructions.privacy.description")}
					</p>
				</div>
			</CardContent>
		</Card>
	);

	if (useAccordion) {
		return (
			<Accordion type="single" collapsible className="w-full">
				<AccordionItem value="instructions" className="border-none">
					<AccordionTrigger className="rounded-xl border border-border bg-card px-6 py-4 text-left font-semibold text-base text-foreground hover:no-underline">
						{t("instructions.title")}
					</AccordionTrigger>
					<AccordionContent className="pt-6">
						<div className="space-y-6">
							<p className="text-muted-foreground text-sm">
								{t("instructions.subtitle")}
							</p>
							{featuresContent}
							{privacySection}
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		);
	}

	return (
		<div className="space-y-6">
			{featuresContent}
			{privacySection}
		</div>
	);
}
