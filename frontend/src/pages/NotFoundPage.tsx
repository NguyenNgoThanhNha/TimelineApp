import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function NotFoundPage() {
  return (
    <Card className="glass-panel">
      <CardContent className="flex flex-col items-center gap-3 py-20 text-center">
        <Compass className="size-10 text-muted-foreground/50" />
        <p className="text-lg font-semibold">Không tìm thấy trang này</p>
        <p className="text-sm text-muted-foreground">
          Đường dẫn có thể đã đổi hoặc nội dung đã bị xoá.
        </p>
        <div className="mt-2 flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/">Về Kanban</Link>
          </Button>
          <Button asChild>
            <Link to="/blog">Xem blog</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
