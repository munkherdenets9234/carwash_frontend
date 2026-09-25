import { BookingDetailScreen } from "../../_components/booking-detail-screen";

export const metadata = { title: "Захиалгын дэлгэрэнгүй · Car Wash" };

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingDetailScreen id={id} />;
}
