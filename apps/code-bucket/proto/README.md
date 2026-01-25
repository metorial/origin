# Protocol Buffers

This directory contains the Protocol Buffer definitions for the code-bucket service.

## Files

- `rpc.proto` - Service definitions for the code bucket gRPC API
- `compiled_proto/` - Generated TypeScript code (gitignored)

## Generating Code

### TypeScript (for nice-grpc)

```bash
bun run proto
```

This will:
1. Create the `compiled_proto/` directory if it doesn't exist
2. Generate TypeScript code from `rpc.proto` using `ts-proto`
3. Output files compatible with `nice-grpc` client/server

**Output:** `compiled_proto/rpc.ts`

### Go (for gRPC server)

The Go protobuf files are already generated and located in `../gen/rpc/`:
- `rpc.pb.go` - Protocol buffer message definitions
- `rpc_grpc.pb.go` - gRPC service definitions

To regenerate Go files (requires `protoc` and Go plugins):
```bash
make proto
# or
./scripts/go-proto.sh
```

## Protocol Buffer Plugins

The project uses:
- **ts-proto**: TypeScript code generation
  - Installed via: `ts-proto` npm package
  - Generates: TypeScript interfaces and nice-grpc service definitions

- **protoc-gen-go**: Go code generation (for server)
  - Requires: `protoc-gen-go` and `protoc-gen-go-grpc` installed globally
  - Generates: Go structs and gRPC server/client code

## Configuration

### TypeScript Options (in package.json)

```bash
--ts_proto_opt=outputServices=nice-grpc,outputServices=generic-definitions,useExactTypes=false
```

- `outputServices=nice-grpc`: Generate nice-grpc service definitions
- `outputServices=generic-definitions`: Also generate generic service definitions
- `useExactTypes=false`: Use more lenient type checking

## Troubleshooting

### "protoc-gen-ts_proto: program not found"

**Solution**: Make sure dependencies are installed:
```bash
bun install
```

The script now uses the absolute path to the node_modules binary.

### "compiled_proto/: No such file or directory"

**Solution**: The script now automatically creates the directory. If you still see this error, manually create it:
```bash
mkdir -p proto/compiled_proto
```

### Changes not reflected

After modifying `rpc.proto`, you must regenerate:
```bash
bun run proto
```

## Usage Example

### Client (TypeScript/nice-grpc)

```typescript
import { CodeBucketClient } from './proto/compiled_proto/rpc';

const client = new CodeBucketClient(/* grpc channel */);
```

### Server (Go)

```go
import pb "github.com/metorial/metorial/services/code-bucket/gen/rpc"

type server struct {
    pb.UnimplementedCodeBucketServer
}

func (s *server) SomeMethod(ctx context.Context, req *pb.SomeRequest) (*pb.SomeResponse, error) {
    // ...
}
```

## Development Workflow

1. Edit `rpc.proto`
2. Run `bun run proto` to generate TypeScript
3. If needed, run `make proto` to regenerate Go code
4. Use the generated types in your code

---

**Status**: ✅ Working (January 25, 2026)
