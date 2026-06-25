import { Database, CheckCircle2, XCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { query } from "@/lib/db";

async function checkDbConnection(): Promise<{ connected: boolean; latency: number; version: string }> {
  const start = Date.now();
  try {
    const result = await query<{ version: string }>("SELECT version()");
    const latency = Date.now() - start;
    const version = (result.rows[0]?.version ?? "").split(" ").slice(0, 2).join(" ");
    return { connected: true, latency, version };
  } catch {
    return { connected: false, latency: 0, version: "" };
  }
}

export async function DatabaseStatus() {
  const status = await checkDbConnection();

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-gray-400" />
          <div>
            <CardTitle className="text-base">Database Connection</CardTitle>
            <CardDescription>Amazon Aurora PostgreSQL status</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border p-4">
          {status.connected ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
          )}
          <div>
            <p className={`font-medium ${status.connected ? "text-green-700" : "text-red-700"}`}>
              {status.connected ? "Connected" : "Disconnected"}
            </p>
            <p className="text-xs text-gray-400">
              {status.connected
                ? `${status.version} · ${status.latency}ms latency`
                : "Check your DATABASE_URL environment variable"}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500 shrink-0" />
            <p className="text-sm font-medium text-blue-800">Aurora PostgreSQL Setup</p>
          </div>
          <div className="space-y-1 text-xs text-blue-700">
            <p>1. Create an Aurora PostgreSQL cluster in AWS RDS</p>
            <p>2. Set <code className="bg-blue-100 rounded px-1 font-mono">DATABASE_URL</code> in your environment</p>
            <p>3. Run <code className="bg-blue-100 rounded px-1 font-mono">npm run db:migrate</code> to create tables</p>
            <p>4. Run <code className="bg-blue-100 rounded px-1 font-mono">npm run db:seed</code> for demo data</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
