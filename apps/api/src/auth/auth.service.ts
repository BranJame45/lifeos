import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  async refresh(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { token };
  }
}
